import { writable, type Writable } from 'svelte/store';

export type ChatMessage = {
    id: string;
    sender: 'me' | 'them';
    text?: string;
    fileUrl?: string; // a local blob url once received/sent
    fileName?: string;
    fileType?: string;
    timestamp: number;
    progress?: number; // for file transfer progress
};

export type ConnectionState = 'disconnected' | 'gathering' | 'connecting' | 'connected' | 'failed';

export class WebRTCManager {
    public pc: RTCPeerConnection;
    public chatChannel: RTCDataChannel | null = null;
    public fileChannel: RTCDataChannel | null = null;

    public connectionState: Writable<ConnectionState> = writable('disconnected');
    public messages: Writable<ChatMessage[]> = writable([]);

    // We wait for all ICE candidates to finish gathering before returning the offer/answer
    // so we don't have to deal with trickle ICE (copy/pasting multiple times).
    private createConnection() {
        if (this.pc) {
            this.pc.close();
        }

        // Use standard STUN servers for finding public IP
        this.pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });

        this.pc.oniceconnectionstatechange = () => {
            console.log("ICE Connection State:", this.pc.iceConnectionState);
            if (this.pc.iceConnectionState === 'connected' || this.pc.iceConnectionState === 'completed') {
                this.connectionState.set('connected');
            } else if (this.pc.iceConnectionState === 'failed' || this.pc.iceConnectionState === 'disconnected' || this.pc.iceConnectionState === 'closed') {
                this.connectionState.set('disconnected');
            }
        };

        // When receiving data channels (as the answerer)
        this.pc.ondatachannel = (event) => {
            const channel = event.channel;
            console.log("Received data channel:", channel.label);
            if (channel.label === 'chat') {
                this.chatChannel = channel;
                this.setupChatChannel();
            } else if (channel.label === 'file') {
                this.fileChannel = channel;
                this.setupFileChannel();
            }
        };
    }

    private setupChatChannel() {
        if (!this.chatChannel) return;

        this.chatChannel.onopen = () => console.log('Chat channel open!');
        this.chatChannel.onclose = () => console.log('Chat channel closed!');

        this.chatChannel.onmessage = (event) => {
            try {
                // Compatible with cjb/serverless-webrtc format usually {"message": "..."}
                const data = JSON.parse(event.data);
                if (data.message) {
                    this.addMessage({
                        id: crypto.randomUUID(),
                        sender: 'them',
                        text: data.message,
                        timestamp: Date.now()
                    });
                }
            } catch (e) {
                console.error("Failed to parse incoming chat message", e);
            }
        };
    }

    // Basic file transfer via chunks
    private fileBuffer: ArrayBuffer[] = [];
    private incomingFileMeta: { name: string, type: string, size: number, receivedSize: number } | null = null;

    private setupFileChannel() {
        if (!this.fileChannel) return;
        this.fileChannel.binaryType = 'arraybuffer';

        this.fileChannel.onmessage = (event) => {
            if (typeof event.data === 'string') {
                // It's the metadata packet preceding a file
                try {
                    const meta = JSON.parse(event.data);
                    if (meta.type === 'file-meta') {
                        this.incomingFileMeta = {
                            name: meta.fileName,
                            type: meta.fileType,
                            size: meta.fileSize,
                            receivedSize: 0
                        };
                        this.fileBuffer = [];
                    }
                } catch (e) { }
            } else if (event.data instanceof ArrayBuffer) {
                if (!this.incomingFileMeta) return;

                this.fileBuffer.push(event.data);
                this.incomingFileMeta.receivedSize += event.data.byteLength;

                // Update progress placeholder message if needed...

                if (this.incomingFileMeta.receivedSize >= this.incomingFileMeta.size) {
                    const blob = new Blob(this.fileBuffer, { type: this.incomingFileMeta.type });
                    const fileUrl = URL.createObjectURL(blob);

                    this.addMessage({
                        id: crypto.randomUUID(),
                        sender: 'them',
                        fileName: this.incomingFileMeta.name,
                        fileType: this.incomingFileMeta.type,
                        fileUrl: fileUrl,
                        timestamp: Date.now()
                    });

                    this.incomingFileMeta = null;
                    this.fileBuffer = [];
                }
            }
        };
    }

    private gatherIceCandidates(onComplete: (desc: RTCSessionDescriptionInit) => void) {
        // Resolve when ICE gathering state is 'complete'
        if (this.pc.iceGatheringState === 'complete') {
            onComplete(this.pc.localDescription!);
            return;
        }

        const checkState = () => {
            if (this.pc.iceGatheringState === 'complete') {
                this.pc.removeEventListener('icegatheringstatechange', checkState);
                onComplete(this.pc.localDescription!);
            }
        };
        this.pc.addEventListener('icegatheringstatechange', checkState);

        // Timeout backup just in case
        setTimeout(() => {
            if (this.pc.iceGatheringState !== 'complete') {
                this.pc.removeEventListener('icegatheringstatechange', checkState);
                onComplete(this.pc.localDescription!);
            }
        }, 3000);
    }

    public async hostChat(): Promise<string> {
        this.connectionState.set('gathering');
        this.createConnection();

        // Host creates the data channels
        this.chatChannel = this.pc.createDataChannel('chat');
        this.setupChatChannel();

        this.fileChannel = this.pc.createDataChannel('file');
        this.setupFileChannel();

        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);

        return new Promise((resolve) => {
            this.gatherIceCandidates((desc) => {
                this.connectionState.set('disconnected'); // Waiting for answer
                const jsonStr = JSON.stringify(desc);
                resolve(btoa(jsonStr)); // Return base64 encoded payload
            });
        });
    }

    public async joinChat(offerBase64: string): Promise<string> {
        this.connectionState.set('gathering');
        this.createConnection();

        let offerStr = '';
        try {
            offerStr = atob(offerBase64);
        } catch (e) {
            // Might be raw JSON instead of base64 if pasted manually
            offerStr = offerBase64;
        }

        const offerDesc = new RTCSessionDescription(JSON.parse(offerStr));
        await this.pc.setRemoteDescription(offerDesc);

        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);

        return new Promise((resolve) => {
            this.gatherIceCandidates((desc) => {
                this.connectionState.set('connecting'); // Trying to connect
                const jsonStr = JSON.stringify(desc);
                resolve(btoa(jsonStr)); // Return base64 encoded payload
            });
        });
    }

    public async acceptAnswer(answerBase64: string): Promise<void> {
        this.connectionState.set('connecting');

        let answerStr = '';
        try {
            answerStr = atob(answerBase64);
        } catch (e) {
            answerStr = answerBase64;
        }

        const answerDesc = new RTCSessionDescription(JSON.parse(answerStr));
        await this.pc.setRemoteDescription(answerDesc);
    }

    public sendTextMessage(text: string) {
        if (this.chatChannel?.readyState === 'open') {
            const payload = JSON.stringify({ message: text });
            this.chatChannel.send(payload);

            this.addMessage({
                id: crypto.randomUUID(),
                sender: 'me',
                text: text,
                timestamp: Date.now()
            });
        }
    }

    public async sendFile(file: File) {
        if (this.fileChannel?.readyState === 'open') {
            // Send metadata first
            this.fileChannel.send(JSON.stringify({
                type: 'file-meta',
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size
            }));

            // Send local message to UI immediately
            const fileUrl = URL.createObjectURL(file);
            this.addMessage({
                id: crypto.randomUUID(),
                sender: 'me',
                fileName: file.name,
                fileType: file.type,
                fileUrl: fileUrl,
                timestamp: Date.now()
            });

            // Chunk and send
            const chunkSize = 16384; // 16KB WebRTC limit safe size
            const arrayBuffer = await file.arrayBuffer();

            for (let i = 0; i < arrayBuffer.byteLength; i += chunkSize) {
                const chunk = arrayBuffer.slice(i, i + chunkSize);
                this.fileChannel.send(chunk);
                // Can add a slight delay here if experiencing channel congestion with huge files
                // await new Promise(r => setTimeout(r, 1)); 
            }
        }
    }

    private addMessage(msg: ChatMessage) {
        this.messages.update(msgs => [...msgs, msg]);
    }

    public cleanup() {
        if (this.chatChannel) this.chatChannel.close();
        if (this.fileChannel) this.fileChannel.close();
        if (this.pc) this.pc.close();
        this.connectionState.set('disconnected');
    }
}
