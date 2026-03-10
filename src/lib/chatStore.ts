import { writable, type Writable } from 'svelte/store';
import { WebRTCManager } from './webrtc';
import { browser } from '$app/environment';

export interface ChatHistoryEntry {
    id: string; // crypto.randomUUID()
    name: string; // e.g. "Chat Mar 10"
    role: 'host' | 'joiner';
    createdAt: number;
}

// Single shared instance of WebRTCManager
export const chatManager = new WebRTCManager();
// Track the active chat name for UI routing
export const activeChatName: Writable<string | null> = writable(null);

// Local storage backed chat history list
export const chatHistory: Writable<ChatHistoryEntry[]> = writable([]);

if (browser) {
    const stored = localStorage.getItem('powerbored_chat_history');
    if (stored) {
        try {
            chatHistory.set(JSON.parse(stored));
        } catch (e) {
            console.error("Failed to parse chat history", e);
        }
    }

    // Subscribe to changes and sync to local storage
    chatHistory.subscribe(value => {
        localStorage.setItem('powerbored_chat_history', JSON.stringify(value));
    });
}

export function saveChatToHistory(name: string, role: 'host' | 'joiner'): string {
    const id = crypto.randomUUID();
    chatHistory.update(history => {
        return [{
            id,
            name,
            role,
            createdAt: Date.now()
        }, ...history];
    });
    return id;
}

export function renameChatHistory(id: string, newName: string) {
    chatHistory.update(history => {
        return history.map(chat => chat.id === id ? { ...chat, name: newName } : chat);
    });
}

export function deleteChatHistory(id: string) {
    chatHistory.update(history => {
        return history.filter(chat => chat.id !== id);
    });
}
