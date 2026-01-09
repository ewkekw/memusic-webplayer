
import Peerjs from 'peerjs';
import { PartyState, PartyMode, PartyParticipant, PartyQueueSong } from '../types';
import { v4 as uuidv4 } from 'uuid';

// @ts-ignore
const Peer = Peerjs.default || Peerjs.Peer || Peerjs;

const PEER_ID_PREFIX = 'memusic-party-v3-';

const HEARTBEAT_INTERVAL_MS = 2000;
const CONNECTION_TIMEOUT_MS = 15000;
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000;

const PEER_CONFIG = {
    host: '0.peerjs.com',
    port: 443,
    secure: true,
    config: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
        ],
        sdpSemantics: 'unified-plan'
    },
    pingInterval: 5000,
    debug: 0
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generatePartyCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 5 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
};

export class PartyHost {
    private peer: any = null;
    private connections: Map<string, any> = new Map();
    private lastParticipantActivity: Map<string, number> = new Map(); // Track liveness
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

        if (onStatusUpdate) onStatusUpdate("Initializing Network...");

        return this.createPeerSession(0, mode, initialName, initialImage, playerState, onStatusUpdate);
    }

    private async createPeerSession(
        retryCount: number, 
        mode: PartyMode, 
        initialName: string, 
        initialImage: string, 
        playerState: any, 
        onStatusUpdate?: (status: string) => void
    ): Promise<string> {
        if (retryCount > 5) throw new Error("Failed to secure a unique Party Code. Please try again.");

        this.partyCode = generatePartyCode();
        const hostId = `${PEER_ID_PREFIX}${this.partyCode}`;

        return new Promise((resolve, reject) => {
            try {
                // @ts-ignore
                const peer = new Peer(hostId, PEER_CONFIG);
                this.peer = peer;

                const timeout = setTimeout(() => {
                    if (!peer.open) {
                        peer.destroy();
                        resolve(this.createPeerSession(retryCount + 1, mode, initialName, initialImage, playerState, onStatusUpdate));
                    }
                }, 8000);

                peer.on('open', () => {
                    clearTimeout(timeout);
                    if (this.isDestroyed) return;

                    if (onStatusUpdate) onStatusUpdate("Ready!");
                    this.startHeartbeatLoop();

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

                peer.on('connection', (conn: any) => this.handleIncomingConnection(conn));

                peer.on('error', (err: any) => {
                    clearTimeout(timeout);
                    if (err.type === 'unavailable-id') {
                        peer.destroy();
                        resolve(this.createPeerSession(retryCount + 1, mode, initialName, initialImage, playerState, onStatusUpdate));
                    } else if (['browser-incompatible', 'ssl-unavailable', 'socket-error'].includes(err.type)) {
                        reject(new Error(`Network Error: ${err.type}`));
                    }
                });

                peer.on('disconnected', () => {
                    if (!this.isDestroyed && this.peer) this.peer.reconnect();
                });

            } catch (e) {
                reject(e);
            }
        });
    }

    private handleIncomingConnection(conn: any) {
        conn.on('open', () => {
            this.connections.set(conn.connectionId, conn);
            
            const currentState = this.callbacks.getCurrentState();
            if (currentState) {
                const safeState = JSON.parse(JSON.stringify(currentState));
                conn.send({ type: 'STATE_UPDATE', payload: safeState });
            }
        });

        conn.on('data', (data: any) => this.handleDataPacket(conn, data));
        
        const cleanup = () => {
            this.connections.delete(conn.connectionId);
        };

        conn.on('close', cleanup);
        conn.on('error', cleanup);
    }

    private startHeartbeatLoop() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        
        this.heartbeatInterval = setInterval(() => {
            if (this.isDestroyed) return;

            const now = Date.now();

            this.connections.forEach((conn, key) => {
                if (!conn.open) this.connections.delete(key);
            });

            if (this.connections.size > 0) {
                this.broadcast(null); 
            }


        }, HEARTBEAT_INTERVAL_MS);
    }

    private handleDataPacket(conn: any, data: any) {
        if (!data) return;

        if (data.senderId) {
            this.lastParticipantActivity.set(data.senderId, Date.now());
        }

        if (data.type === 'PING') {
            try {
                conn.send({ 
                    type: 'PONG', 
                    payload: { 
                        clientSentTime: data.payload, 
                        hostTime: Date.now() 
                    } 
                });
            } catch (e) { /* ignore send errors */ }
            return;
        }

        const currentState = this.callbacks.getCurrentState();
        if (!currentState) return;

        let newState = { ...currentState };
        let changed = false;

        switch (data.type) {
            case 'JOIN':
                if (!newState.participants.some((p: PartyParticipant) => p.id === data.payload.id)) {
                    newState.participants.push({ ...data.payload, isHost: false });
                    changed = true;
                }
                try { conn.send({ type: 'JOIN_ACK', payload: { success: true } }); } catch(e) {}
                break;
                
            case 'LEAVE':
                newState.participants = newState.participants.filter((p: PartyParticipant) => p.id !== data.senderId);
                changed = true;
                break;
                
            case 'ADD_SONG':
                if (newState.mode === 'collaborative') {
                    const songToAdd = { ...data.payload, addedBy: data.senderId };
                    const lastSong = newState.currentQueue[newState.currentQueue.length - 1];
                    if (!lastSong || lastSong.id !== songToAdd.id) {
                        newState.currentQueue = [...newState.currentQueue, songToAdd];
                        this.callbacks.onAddSongs([songToAdd]);
                        changed = true;
                    }
                }
                break;
                
            case 'REMOVE_SONG':
                if (newState.mode === 'collaborative') {
                    const songIndex = newState.currentQueue.findIndex((s: PartyQueueSong) => s.id === data.payload && s.addedBy === data.senderId);
                    if (songIndex !== -1) {
                        this.callbacks.onRemoveSong(data.payload);
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
            if (conn.open) {
                try { conn.send(message); } catch (e) {
                    console.warn(`Failed to broadcast to ${conn.connectionId}`);
                }
            }
        });
    }

    public destroy() {
        this.isDestroyed = true;
        clearInterval(this.heartbeatInterval);
        try { this.broadcast(null); } catch (e) {}
        this.connections.forEach(c => { try { c.close(); } catch (e) {} });
        this.connections.clear();
        if (this.peer) {
            try { this.peer.destroy(); } catch (e) {}
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
    
    private partyCode: string = '';
    private guestProfile: { name: string, image: string } | null = null;
    private lastPacketTime: number = 0;
    private monitorInterval: any = null;
    private isRecovering = false;
    private reconnectAttempts = 0;

    constructor(myId: string, callbacks: any) {
        this.myId = myId;
        this.callbacks = callbacks;
    }

    public async join(partyCode: string, name: string, image: string): Promise<{ success: boolean, messageKey: string, errorMessage?: string }> {
        this.destroy(); 
        this.isDestroyed = false;
        this.reconnectAttempts = 0;
        
        this.partyCode = partyCode;
        this.guestProfile = { name, image };
        
        return this.initializePeerAndConnect();
    }

    private initializePeerAndConnect(): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                // @ts-ignore
                this.peer = new Peer(PEER_CONFIG);
                
                this.peer.on('open', () => {
                    this.connectToHost(resolve, reject);
                });

                this.peer.on('error', (err: any) => {
                    if (['browser-incompatible', 'ssl-unavailable'].includes(err.type)) {
                        reject(new Error(`Device incompatible: ${err.type}`));
                    } else if (err.type === 'peer-unavailable') {
                        reject(new Error("Party not found. Check code or host status."));
                    } else {
                        reject(new Error("Connection error. Please try again."));
                    }
                });

                this.peer.on('disconnected', () => {
                    if (!this.isDestroyed && this.peer) this.peer.reconnect();
                });

            } catch (e) {
                reject(e);
            }
        });
    }

    private connectToHost(resolve?: (val: any) => void, reject?: (err: any) => void) {
        if (this.isDestroyed || !this.peer || !this.peer.open) {
            if (reject) reject(new Error("Internal Peer Error"));
            return;
        }

        const targetId = `${PEER_ID_PREFIX}${this.partyCode.toUpperCase()}`;
        const conn = this.peer.connect(targetId, { reliable: true, serialization: 'json' });
        
        this.conn = conn;
        
        const handshakeTimeout = setTimeout(() => {
            if (conn && !conn.open) {
                conn.close();
                if (reject) reject(new Error("Host unresponsive."));
                else this.triggerRecovery();
            }
        }, 10000);

        conn.on('open', () => {
            clearTimeout(handshakeTimeout);
            this.isRecovering = false;
            this.reconnectAttempts = 0;
            this.lastPacketTime = Date.now();

            if (this.guestProfile) {
                this.send('JOIN', { id: this.myId, name: this.guestProfile.name, imageUrl: this.guestProfile.image });
            }
            this.send('PING', Date.now());

            this.setupConnectionListeners();
            this.startConnectionMonitor();

            if (resolve) resolve({ success: true, messageKey: 'party.joined' });
        });

        conn.on('error', (err: any) => {
            console.warn("Connection Error:", err);
        });

        conn.on('close', () => {
            if (!this.isDestroyed) this.triggerRecovery();
        });
    }

    private setupConnectionListeners() {
        if (!this.conn) return;
        
        this.conn.on('data', (data: any) => {
            this.lastPacketTime = Date.now();
            if (!data) return;
            
            if (data.type === 'PONG') {
                const now = Date.now();
                const { clientSentTime, hostTime } = data.payload;
                this.timeOffset = (hostTime + (now - clientSentTime) / 2) - now;
            } else if (data.type === 'STATE_UPDATE') {
                if (data.payload) this.callbacks.onStateUpdate(data.payload);
            }
        });
    }

    private startConnectionMonitor() {
        if (this.monitorInterval) clearInterval(this.monitorInterval);
        
        this.monitorInterval = setInterval(() => {
            if (this.isDestroyed) return;

            const timeSinceLastPacket = Date.now() - this.lastPacketTime;

            if (timeSinceLastPacket > CONNECTION_TIMEOUT_MS && !this.isRecovering) {
                console.warn("[Guest] Connection stale. Attempting recovery...");
                this.triggerRecovery();
            }
        }, 2000);
    }

    private async triggerRecovery() {
        if (this.isDestroyed || this.isRecovering) return;
        this.isRecovering = true;

        if (this.conn) {
            try { this.conn.close(); } catch(e) {}
            this.conn = null;
        }

        if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            this.callbacks.onConnectionLost();
            this.destroy();
            return;
        }

        const delay = BASE_RECONNECT_DELAY * Math.pow(1.5, this.reconnectAttempts);
        this.reconnectAttempts++;
        await wait(delay);

        if (this.peer) {
            if (this.peer.disconnected) {
                this.peer.reconnect();
                await wait(1000);
            } else if (this.peer.destroyed) {
                this.callbacks.onConnectionLost();
                return;
            }
        }

        console.log(`[Guest] Reconnecting... Attempt ${this.reconnectAttempts}`);
        this.connectToHost();
    }

    public send(type: string, payload: any) {
        if (this.conn && this.conn.open) {
            try { 
                this.conn.send({ type, payload, senderId: this.myId }); 
            } catch (e) {
                console.warn("Send failed", e);
            }
        }
    }

    public destroy() {
        this.isDestroyed = true;
        clearInterval(this.monitorInterval);
        
        if (this.conn) {
            try { this.send('LEAVE', null); this.conn.close(); } catch (e) {}
            this.conn = null;
        }
        
        if (this.peer) {
            try { this.peer.destroy(); } catch (e) {}
            this.peer = null;
        }
        this.timeOffset = null;
    }
}
