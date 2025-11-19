
import { v4 as uuidv4 } from 'uuid';
// @ts-ignore
import { Peer } from 'peerjs';
import { PartyState, PartyMode, PartyParticipant, PartyQueueSong } from '../types';

const PEER_ID_PREFIX = 'memusic-party-';
const GOOGLE_STUN = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];

const getPeerConfig = (strategy: 'robust' | 'minimal' | 'default') => {
    const baseConfig = { debug: 1, pingInterval: 5000 };
    if (strategy === 'default') return { ...baseConfig };
    if (strategy === 'minimal') return { ...baseConfig, host: '0.peerjs.com', port: 443, secure: true, config: { iceServers: GOOGLE_STUN, iceTransportPolicy: 'all' } };
    return { ...baseConfig, host: '0.peerjs.com', port: 443, secure: true, config: { iceServers: GOOGLE_STUN, sdpSemantics: 'unified-plan', iceTransportPolicy: 'all' } };
};

const generatePartyCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
};

const logger = {
    info: (msg: string) => console.log(`%c[PartySystem] ${msg}`, 'color: #3b82f6'),
    warn: (msg: string) => console.warn(`[PartySystem] WARNING: ${msg}`),
    error: (msg: string, err?: any) => console.error(`[PartySystem] ERROR: ${msg}`, err || ''),
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
        this.isDestroyed = false;
        this.destroy(); 
        
        const strategies: ('default' | 'robust' | 'minimal')[] = ['default', 'robust', 'minimal'];

        for (const strategy of strategies) {
             if (this.isDestroyed) break;
             try {
                 if (onStatusUpdate) onStatusUpdate(strategy === 'default' ? "Initializing..." : "Retrying connection...");
                 await wait(500); 
                 return await this.attemptConnection(strategy, mode, initialName, initialImage, playerState);
             } catch (e: any) {
                 logger.warn(`Strategy '${strategy}' failed: ${e.message}`);
                 await wait(1000);
             }
        }
        throw new Error("CONNECTION_FAILED");
    }

    private attemptConnection(strategy: 'default' | 'robust' | 'minimal', mode: PartyMode, initialName: string, initialImage: string, playerState: any): Promise<string> {
        return new Promise((resolve, reject) => {
            this.partyCode = generatePartyCode();
            const hostId = `${PEER_ID_PREFIX}${this.partyCode}`;
            const config = getPeerConfig(strategy);
            
            if (this.peer) { this.peer.destroy(); this.peer = null; }

            try {
                const peer = new Peer(hostId, config);
                this.peer = peer;
                let isResolved = false;

                const connectionTimeout = setTimeout(() => {
                    if (!isResolved) {
                        peer.destroy();
                        reject(new Error("Timeout"));
                    }
                }, 8000);

                peer.on('open', () => {
                    if (isResolved) return;
                    isResolved = true;
                    clearTimeout(connectionTimeout);
                    logger.info(`Host Session Active. ID: ${this.partyCode}`);
                    
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
                    if (['invalid-id', 'unavailable-id', 'network', 'socket-error', 'ssl-unavailable'].includes(err.type)) {
                        if (!isResolved) {
                            isResolved = true;
                            clearTimeout(connectionTimeout);
                            reject(err);
                        }
                    } else {
                        logger.error(`Peer Error (${err.type})`, err);
                    }
                });
                
                peer.on('disconnected', () => {
                    if (!peer.destroyed && !this.isDestroyed) peer.reconnect();
                });

            } catch (e) { reject(e); }
        });
    }

    private startHeartbeat() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = setInterval(() => {
            if (this.connections.length > 0) this.broadcast(null);
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
        const message = state ? { type: 'STATE_UPDATE', payload: state } : { type: 'HEARTBEAT' };
        this.connections.forEach(conn => {
            if (conn.open) { try { conn.send(message); } catch (e) {} }
        });
    }

    public destroy() {
        this.isDestroyed = true;
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.broadcast(null); 
        this.connections.forEach(c => c.close());
        this.connections = [];
        if (this.peer) { this.peer.destroy(); this.peer = null; }
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
        this.isDestroyed = false;
        this.destroy();
        const targetId = `${PEER_ID_PREFIX}${partyCode.toUpperCase()}`;
        const strategies: ('default' | 'minimal' | 'robust')[] = ['default', 'minimal', 'robust'];

        for (const strategy of strategies) {
             if (this.isDestroyed) break;
             try {
                 await wait(500);
                 return await this.attemptJoin(targetId, strategy, name, image);
             } catch (e: any) {
                 logger.warn(`Guest join strategy '${strategy}' failed: ${e.message}`);
             }
        }
        return { success: false, messageKey: 'party.inactive', errorMessage: "Could not find party." };
    }

    private attemptJoin(targetId: string, strategy: 'default' | 'minimal' | 'robust', name: string, image: string): Promise<{success: boolean, messageKey: string}> {
        return new Promise((resolve, reject) => {
             const config = getPeerConfig(strategy);
             if (this.peer) { this.peer.destroy(); }
             
             try {
                const peer = new Peer(config);
                this.peer = peer;
                let connectionMade = false;

                const timeout = setTimeout(() => {
                    if (!connectionMade) reject(new Error("Handshake Timeout"));
                }, 6000);

                peer.on('open', () => {
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
                    conn.on('close', () => { if(connectionMade) this.callbacks.onConnectionLost(); });
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
        if (this.conn && this.conn.open) this.conn.send({ type, payload, senderId: this.myId });
    }

    public destroy() {
        this.isDestroyed = true;
        if (this.conn) { this.send('LEAVE', null); this.conn.close(); this.conn = null; }
        if (this.peer) { this.peer.destroy(); this.peer = null; }
        this.timeOffset = null;
    }
}
