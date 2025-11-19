
import { v4 as uuidv4 } from 'uuid';
import Peerjs from 'peerjs';
import { PartyState, PartyMode, PartyParticipant, PartyQueueSong } from '../types';

// Robust Peer class retrieval to handle various ESM/CommonJS output formats
// @ts-ignore
const Peer = Peerjs.default || Peerjs.Peer || Peerjs;

const PEER_ID_PREFIX = 'memusic-party-';

// Single, robust configuration for both Host and Guest
const PEER_CONFIG = {
    host: '0.peerjs.com',
    port: 443,
    secure: true,
    config: {
        iceServers: [
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
        ],
        sdpSemantics: 'unified-plan'
    },
    pingInterval: 5000,
    debug: 1 // 0: None, 1: Errors, 2: Warnings, 3: All
};

const generatePartyCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 5 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
};

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
        
        if (onStatusUpdate) onStatusUpdate("Connecting to server...");

        return new Promise((resolve, reject) => {
            this.partyCode = generatePartyCode();
            const hostId = `${PEER_ID_PREFIX}${this.partyCode}`;

            try {
                // @ts-ignore
                const peer = new Peer(hostId, PEER_CONFIG);
                this.peer = peer;

                const timeout = setTimeout(() => {
                    if (!this.isDestroyed) {
                        console.warn('[PartyHost] Connection to signaling server timed out.');
                        reject(new Error("Connection timed out. Please try again."));
                        this.destroy();
                    }
                }, 15000);

                peer.on('open', (id: string) => {
                    clearTimeout(timeout);
                    if (this.isDestroyed) return;

                    if (onStatusUpdate) onStatusUpdate("Party created!");
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
                    clearTimeout(timeout);
                    console.error('[PartyHost] Peer error:', err);
                    if (!this.isDestroyed) {
                         if (err.type === 'unavailable-id') {
                             // Highly unlikely with random 5 chars, but possible. Recursion handled by caller usually, but we just fail here.
                             reject(new Error("Party code collision. Please try again."));
                         } else {
                             reject(new Error("Failed to create party. Check connection."));
                         }
                         this.destroy();
                    }
                });

                peer.on('disconnected', () => {
                    if (!peer.destroyed && !this.isDestroyed) {
                        try { peer.reconnect(); } catch (e) { }
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
            
            conn.on('close', () => { 
                this.connections = this.connections.filter(c => c !== conn); 
            });
            
            conn.on('error', (err: any) => {
                console.error('[PartyHost] Connection error:', err);
                this.connections = this.connections.filter(c => c !== conn);
            });
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
        try { this.broadcast(null); } catch (e) { }

        this.connections.forEach(c => { try { c.close(); } catch (e) { } });
        this.connections = [];
        
        if (this.peer) {
            try { 
                this.peer.disconnect(); 
                this.peer.destroy(); 
            } catch (e) { }
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

    public async join(partyCode: string, name: string, image: string): Promise<{ success: boolean, messageKey: string, errorMessage?: string }> {
        this.destroy();
        this.isDestroyed = false;
        const targetId = `${PEER_ID_PREFIX}${partyCode.toUpperCase()}`;

        return new Promise((resolve, reject) => {
            try {
                // @ts-ignore
                const peer = new Peer(PEER_CONFIG);
                this.peer = peer;
                let connectionMade = false;

                const timeout = setTimeout(() => {
                    if (!connectionMade) {
                        try { peer.destroy(); } catch (e) { }
                        reject(new Error("Connection timed out. Party might be inactive."));
                    }
                }, 10000);

                peer.on('open', () => {
                    if (this.isDestroyed) {
                        peer.destroy();
                        return;
                    }

                    // Explicitly check if the peer is available by handling the error on the peer instance
                    // Note: PeerJS 1.5+ emits 'error' with 'peer-unavailable' if connect fails for that reason
                    const conn = peer.connect(targetId, { reliable: true });

                    conn.on('open', () => {
                        clearTimeout(timeout);
                        connectionMade = true;
                        this.conn = conn;
                        this.setupConnectionListeners();

                        this.send('PING', Date.now());
                        this.send('JOIN', { id: this.myId, name, imageUrl: image });
                        resolve({ success: true, messageKey: 'party.joined' });
                    });

                    conn.on('error', (err: any) => {
                        console.error('[PartyGuest] Connection error:', err);
                        if (!connectionMade) {
                            clearTimeout(timeout);
                            reject(new Error("Failed to connect to party host."));
                        }
                    });
                    
                    conn.on('close', () => {
                         if (connectionMade && !this.isDestroyed) this.callbacks.onConnectionLost();
                    });
                });

                peer.on('error', (err: any) => {
                    console.error('[PartyGuest] Peer error:', err);
                    if (!connectionMade) {
                        clearTimeout(timeout);
                        if (err.type === 'peer-unavailable') {
                             resolve({ success: false, messageKey: 'party.notFound', errorMessage: "Party not found. Check the code." });
                        } else {
                             reject(new Error(`Connection failed: ${err.type}`));
                        }
                    }
                });

            } catch (e) {
                reject(e);
            }
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
            try { this.conn.send({ type, payload, senderId: this.myId }); } catch (e) { }
        }
    }

    public destroy() {
        this.isDestroyed = true;
        if (this.conn) {
            try { this.send('LEAVE', null); this.conn.close(); } catch (e) { }
            this.conn = null;
        }
        if (this.peer) {
            try { 
                this.peer.disconnect();
                this.peer.destroy(); 
            } catch (e) { }
            this.peer = null;
        }
        this.timeOffset = null;
    }
}
