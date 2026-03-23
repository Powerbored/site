import { writable, get } from "svelte/store";

export type NodeType = "number-input" | "logic-and" | "logic-or" | "logic-not" | "output";

export interface Port {
    id: string; // "nodeId-in-0" or "nodeId-out-0"
    nodeId: string;
    direction: "in" | "out";
    index: number;
}

export interface Node {
    id: string;
    type: NodeType;
    x: number;
    y: number;
    value: number; // For input nodes, this is the entered value. For logic/output, this is the evaluated value.
}

export interface Connection {
    id: string; // "fromPortId:toPortId"
    fromPortId: string; // always an "out" port
    toPortId: string; // always an "in" port
}

export interface EditorState {
    nodes: Record<string, Node>;
    connections: Record<string, Connection>;
    nextId: number;
}

const STORAGE_KEY = "powerbored-node-editor";

function createInitialState(): EditorState {
    if (typeof window !== "undefined") {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (err) {
                console.error("Failed to parse stored node editor state", err);
            }
        }
    }
    return {
        nodes: {},
        connections: {},
        nextId: 1,
    };
}

const initialState = createInitialState();

export const editorStore = writable<EditorState>(initialState);

// Auto-save subscription
if (typeof window !== "undefined") {
    editorStore.subscribe((state) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    });
}

// Actions

export function addNode(type: NodeType, x: number, y: number) {
    editorStore.update(state => {
        const id = `node-${state.nextId++}`;
        state.nodes[id] = { id, type, x: Math.round(x), y: Math.round(y), value: 0 };
        return { ...state };
    });
    evaluateGraph();
}

export function removeNode(id: string) {
    editorStore.update(state => {
        delete state.nodes[id];
        // Remove connected wires
        const connsToRemove = Object.values(state.connections).filter(c => 
            c.fromPortId.startsWith(`${id}-`) || c.toPortId.startsWith(`${id}-`)
        );
        for (const c of connsToRemove) {
            delete state.connections[c.id];
        }
        return { ...state };
    });
    evaluateGraph();
}

export function updateNodePosition(id: string, x: number, y: number) {
    editorStore.update(state => {
        if (state.nodes[id]) {
            state.nodes[id].x = Math.round(x);
            state.nodes[id].y = Math.round(y);
        }
        return { ...state };
    });
}

export function updateNodeValue(id: string, value: number) {
    editorStore.update(state => {
        if (state.nodes[id]) {
            state.nodes[id].value = value;
        }
        return { ...state };
    });
    evaluateGraph();
}

export function addConnection(fromPortId: string, toPortId: string) {
    // Ensure from is 'out' and to is 'in'
    if (!fromPortId.includes("-out-") || !toPortId.includes("-in-")) return;

    editorStore.update(state => {
        // One input port can only have one connection. Remove existing connection to this port.
        const existingTo = Object.values(state.connections).find(c => c.toPortId === toPortId);
        if (existingTo) {
            delete state.connections[existingTo.id];
        }

        const id = `${fromPortId}:${toPortId}`;
        state.connections[id] = { id, fromPortId, toPortId };
        return { ...state };
    });
    evaluateGraph();
}

export function removeConnection(id: string) {
    editorStore.update(state => {
        delete state.connections[id];
        return { ...state };
    });
    evaluateGraph();
}

export function clearAll() {
    editorStore.update(state => ({
        nodes: {},
        connections: {},
        nextId: 1
    }));
}

export function exportJSON() {
    const state = get(editorStore);
    const jsonStr = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "powerbored-nodes.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Graph Evaluation

export function evaluateGraph() {
    editorStore.update(state => {
        // Simple topo sort or just iterative relaxation
        // Since it's a simple DAG (without cycle detection right now), we can just evaluate repeatedly
        // until no values change, or limit to Max Iterations to prevent infinite loop.
        
        let changed = true;
        let iter = 0;
        const maxIter = 100;

        // Reset volatile node values to 0 before eval, except number-input
        for (const id in state.nodes) {
            if (state.nodes[id].type !== "number-input") {
                state.nodes[id].value = 0;
            }
        }

        while (changed && iter < maxIter) {
            changed = false;
            iter++;

            for (const id in state.nodes) {
                const node = state.nodes[id];
                if (node.type === "number-input") continue;

                // Find inputs for this node
                const inConnections = Object.values(state.connections).filter(c => c.toPortId.startsWith(`${id}-in-`));
                
                // Read values from connection sources
                const inValues = inConnections.map(c => {
                    const sourceNodeId = c.fromPortId.split("-out-")[0];
                    return state.nodes[sourceNodeId]?.value || 0;
                });

                let newValue = 0;
                
                if (node.type === "logic-not") {
                    const input = inValues[0] || 0;
                    newValue = input === 0 ? 1 : 0;
                } else if (node.type === "logic-and") {
                    const valA = inValues[0] || 0;
                    const valB = inValues[1] || 0;
                    newValue = (valA !== 0 && valB !== 0) ? 1 : 0;
                } else if (node.type === "logic-or") {
                    const valA = inValues[0] || 0;
                    const valB = inValues[1] || 0;
                    newValue = (valA !== 0 || valB !== 0) ? 1 : 0;
                } else if (node.type === "output") {
                    newValue = inValues[0] || 0;
                }

                if (node.value !== newValue) {
                    node.value = newValue;
                    changed = true;
                }
            }
        }
        
        return { ...state };
    });
}
