
import { v4 as uuidv4 } from 'uuid';
import Peerjs from 'peerjs';
import { PartyState, PartyMode, PartyParticipant, PartyQueueSong } from '../types';

// Robust Peer class retrieval to handle various ESM/CommonJS output formats
// @ts-ignore
const Peer = Peerjs.default || Peerjs.Peer || Peerjs;

const PEER_ID_PREFIX = 'memusic-party-';
const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
];

const getPeerConfig = (strategy: 'default' | 'robust' | 'legacy') => {
    const base = { debug: 0, pingInterval: 5000 };
    const cloudConfig = {
        host: '0.peerjs.com',
        port: 443,
        secure: true,
        config: { iceServers: ICE_SERVERS }
    };

    switch (strategy) {
        case 'default':
            return { ...base, ...cloudConfig };
        case 'robust':
            return { 
                ...base, 
                ...cloudConfig, 
                config: { ...cloudConfig.config, sdpSemantics: 'unified-plan' } 
            };
        case 'legacy':
        default:
            return base;
    }
};

const generatePartyCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 5 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class PartyHost {
    private peer: any = null;
    private connections: any[] = [];
    private partyCode: string = '';
    private myId: string;
    private callbacks: any;
    private heartbeatInterval: any = null;
    private isDestroyed = false;

    constructor(myId: string, callbacks: any) {
        this.myId = myId;
        this.callbacks = callbacks;
    }

    public async start(mode: PartyMode, initialName: string, initialImage: string, playerState: any, onStatusUpdate?: (status: string) => void): Promise<string> {
        this.destroy();
        this.isDestroyed = false;
        
        const strategies: ('default' | 'robust' | 'legacy')[] = ['default', 'robust', 'legacy'];

        for (const strategy of strategies) {
             if (this.isDestroyed) break;
             try {
                 if (onStatusUpdate) onStatusUpdate(strategy === 'default' ? "Initializing..." : "Retrying connection...");
                 // Small delay between attempts to clear previous sockets
                 await wait(500); 
                 return await this.attemptConnection(strategy, mode, initialName, initialImage, playerState);
             } catch (e: any) {
                 console.warn(`[PartyHost] Strategy '${strategy}' failed:`, e);
             }
        }
        throw new Error("CONNECTION_FAILED");
    }

    private attemptConnection(strategy: 'default' | 'robust' | 'legacy', mode: PartyMode, initialName: string, initialImage: string, playerState: any): Promise<string> {
        return new Promise((resolve, reject) => {
            // Generate a new code for each attempt to avoid ID collisions/caching issues
            this.partyCode = generatePartyCode();
            const hostId = `${PEER_ID_PREFIX}${this.partyCode}`;
            
            if (this.peer) { 
                try { this.peer.destroy(); } catch(e) {}
                this.peer = null; 
            }

            try {
                // @ts-ignore
                const peer = new Peer(hostId, getPeerConfig(strategy));
                this.peer = peer;
                let isResolved = false;

                const timeout = setTimeout(() => {
                    if (!isResolved) {
                        isResolved = true;
                        console.warn(`[PartyHost] Connection timeout for strategy ${strategy}`);
                        try { peer.destroy(); } catch(e) {}
                        reject(new Error("Timeout"));
                    }
                }, 15000); // Increased timeout for slower networks

                peer.on('open', (id: string) => {
                    if (isResolved) return;
                    isResolved = true;
                    clearTimeout(timeout);
                    
                    this.startHeartbeat();
                    this.setupPeerListeners();
                    
                    const initialState: PartyState = {
                        partyId: this.partyCode,
                        hostId: this.myId,
                        mode,
                        participants: [{ id: this.myId, name: initialName, imageUrl: initialImage, isHost: true }],
                        isPlaying: playerState.isPlaying,
                        currentSong: playerState.currentSong,
                        currentQueue: playerState.currentQueue.map((s: any) => ({ ...s, addedBy: this.myId })),
                        currentTime: playerState.currentTime,
                        lastSeekTime: Date.now(),
                        lastStateUpdate: Date.now(),
                        hostPing: Date.now(),
                        reactions: []
                    };
                    
                    this.callbacks.onStateChange(initialState);
                    resolve(this.partyCode);
                });

                peer.on('error', (err: any) => {
                    if (!isResolved) {
                        isResolved = true;
                        clearTimeout(timeout);
                        // Don't destroy here, let the caller handle cleanup or retry
                        reject(err);
                    }
                });
                
                peer.on('disconnected', () => {
                    if (!peer.destroyed && !this.isDestroyed) {
                        try { peer.reconnect(); } catch(e) {}
                    }
                });

            } catch (e) { 
                reject(e); 
            }
        });
    }

    private startHeartbeat() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = setInterval(() => {
            if (this.connections.length > 0 && !this.isDestroyed) this.broadcast(null);
        }, 3000);
    }

    private setupPeerListeners() {
        if (!this.peer) return;

        this.peer.on('connection', (conn: any) => {
            this.connections.push(conn);
            conn.on('open', () => {
                const currentState = this.callbacks.getCurrentState();
                if (currentState) conn.send({ type: 'STATE_UPDATE', payload: currentState });
            });
            conn.on('data', (data: any) => this.handleData(conn, data));
            conn.on('close', () => { this.connections = this.connections.filter(c => c !== conn); });
            conn.on('error', () => { this.connections = this.connections.filter(c => c !== conn); });
        });
    }

    private handleData(conn: any, data: any) {
        if (!data) return;

        if (data.type === 'PING') {
            conn.send({ type: 'PONG', payload: { clientSentTime: data.payload, hostTime: Date.now() } });
            return;
        }

        const currentState = this.callbacks.getCurrentState();
        if (!currentState) return;

        let newState = { ...currentState };
        let changed = false;

        switch (data.type) {
            case 'JOIN':
                if (!newState.participants.find((p: PartyParticipant) => p.id === data.payload.id)) {
                    newState.participants = [...newState.participants, { ...data.payload, isHost: false }];
                    changed = true;
                }
                break;
            case 'LEAVE':
                newState.participants = newState.participants.filter((p: PartyParticipant) => p.id !== data.senderId);
                changed = true;
                break;
            case 'ADD_SONG':
                if (newState.mode === 'collaborative') {
                    const songToAdd = { ...data.payload, addedBy: data.senderId };
                    if (!newState.currentQueue.some((s: PartyQueueSong) => s.id === songToAdd.id)) {
                        newState.currentQueue = [...newState.currentQueue, songToAdd];
                        this.callbacks.onAddSongs([songToAdd]);
                        changed = true;
                    }
                }
                break;
            case 'REMOVE_SONG':
                if (newState.mode === 'collaborative') {
                    const song = newState.currentQueue.find((s: PartyQueueSong) => s.id === data.payload);
                    if (song && (song.addedBy === data.senderId)) {
                        this.callbacks.onRemoveSong(data.payload);
                        changed = true;
                    }
                }
                break;
            case 'REACTION':
                newState.reactions = [...newState.reactions.slice(-20), { id: uuidv4(), emoji: data.payload, senderId: data.senderId || 'anon' }];
                changed = true;
                break;
        }

        if (changed) {
            this.callbacks.onStateChange(newState);
            this.broadcast(newState);
        }
    }

    public broadcast(state: PartyState | null) {
        if (this.isDestroyed) return;
        const message = state ? { type: 'STATE_UPDATE', payload: state } : { type: 'HEARTBEAT' };
        this.connections.forEach(conn => {
            if (conn.open) { try { conn.send(message); } catch (e) {} }
        });
    }

    public destroy() {
        this.isDestroyed = true;
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        // Try to notify clients before closing, but don't wait
        try { this.broadcast(null); } catch(e) {}
        
        this.connections.forEach(c => { try { c.close(); } catch(e){} });
        this.connections = [];
        if (this.peer) { 
            try { this.peer.destroy(); } catch(e){} 
            this.peer = null; 
        }
    }
}

export class PartyGuest {
    private peer: any = null;
    private conn: any = null;
    private myId: string;
    private callbacks: any;
    public timeOffset: number | null = null;
    private isDestroyed = false;

    constructor(myId: string, callbacks: any) {
        this.myId = myId;
        this.callbacks = callbacks;
    }

    public async join(partyCode: string, name: string, image: string): Promise<{success: boolean, messageKey: string, errorMessage?: string}> {
        this.destroy();
        this.isDestroyed = false;
        
        const targetId = `${PEER_ID_PREFIX}${partyCode.toUpperCase()}`;
        const strategies: ('default' | 'robust' | 'legacy')[] = ['default', 'robust', 'legacy'];

        for (const strategy of strategies) {
             if (this.isDestroyed) break;
             try {
                 await wait(500);
                 return await this.attemptJoin(targetId, strategy, name, image);
             } catch (e: any) {
                 console.warn(`[PartyGuest] Join strategy '${strategy}' failed:`, e);
             }
        }
        return { success: false, messageKey: 'party.inactive', errorMessage: "Could not find party." };
    }

    private attemptJoin(targetId: string, strategy: 'default' | 'robust' | 'legacy', name: string, image: string): Promise<{success: boolean, messageKey: string}> {
        return new Promise((resolve, reject) => {
             if (this.peer) { try { this.peer.destroy(); } catch(e){} }
             
             try {
                // @ts-ignore
                const peer = new Peer(getPeerConfig(strategy));
                this.peer = peer;
                let connectionMade = false;

                const timeout = setTimeout(() => {
                    if (!connectionMade) {
                        try { peer.destroy(); } catch(e){}
                        reject(new Error("Handshake Timeout"));
                    }
                }, 10000);

                peer.on('open', () => {
                    if (this.isDestroyed) {
                        peer.destroy();
                        return;
                    }
                    const conn = peer.connect(targetId, { reliable: true, serialization: 'json' });
                    
                    conn.on('open', () => {
                        clearTimeout(timeout);
                        connectionMade = true;
                        this.conn = conn;
                        this.setupConnectionListeners();
                        
                        this.send('PING', Date.now());
                        this.send('JOIN', { id: this.myId, name, imageUrl: image });
                        resolve({ success: true, messageKey: 'party.joined' });
                    });

                    conn.on('error', (err: any) => { if(!connectionMade) reject(err); });
                    conn.on('close', () => { if(connectionMade && !this.isDestroyed) this.callbacks.onConnectionLost(); });
                });

                peer.on('error', (err: any) => { if (!connectionMade) reject(err); });
            } catch (e) { reject(e); }
        });
    }

    private setupConnectionListeners() {
        if (!this.conn) return;
        this.conn.on('data', (data: any) => {
            if (!data) return;
            if (data.type === 'PONG') {
                const now = Date.now();
                const { clientSentTime, hostTime } = data.payload;
                this.timeOffset = (now - (now - clientSentTime) / 2) - hostTime;
            } else if (data.type === 'STATE_UPDATE') {
                if (data.payload) this.callbacks.onStateUpdate(data.payload);
            }
        });
    }

    public send(type: string, payload: any) {
        if (this.conn && this.conn.open) {
            try { this.conn.send({ type, payload, senderId: this.myId }); } catch(e) {}
        }
    }

    public destroy() {
        this.isDestroyed = true;
        if (this.conn) { 
            try { this.send('LEAVE', null); this.conn.close(); } catch(e){}
            this.conn = null; 
        }
        if (this.peer) { 
            try { this.peer.destroy(); } catch(e){}
            this.peer = null; 
        }
        this.timeOffset = null;
    }
}
