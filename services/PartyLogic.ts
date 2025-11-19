import { v4 as uuidv4 } from 'uuid';
// @ts-ignore
import { Peer } from 'peerjs';
import { PartyState, PartyMode, PartyParticipant, PartyQueueSong } from '../types';

const PEER_ID_PREFIX = 'memusic-party-';

const getPeerConfig = () => ({
    host: '0.peerjs.com',
    port: 443,
    secure: true,
    debug: 0,
    pingInterval: 5000,
    config: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun.nextcloud.com:443' }
        ]
    }
});

const generatePartyCode = () => {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
};

export class PartyHost {
    private peer: any = null;
    private connections: any[] = [];
    private partyCode: string = '';
    private myId: string;
    private callbacks: any;

    constructor(myId: string, callbacks: any) {
        this.myId = myId;
        this.callbacks = callbacks;
    }

    public async start(mode: PartyMode, initialName: string, initialImage: string, playerState: any): Promise<string> {
        this.destroy();
        
        return new Promise((resolve, reject) => {
            const createPeer = (attempt: number) => {
                if (attempt > 5) {
                    reject(new Error("Max attempts reached"));
                    return;
                }

                this.partyCode = generatePartyCode();
                const hostId = `${PEER_ID_PREFIX}${this.partyCode}`;
                const peer = new Peer(hostId, getPeerConfig());

                peer.on('open', () => {
                    this.peer = peer;
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

                peer.on('error', () => {
                    peer.destroy();
                    setTimeout(() => createPeer(attempt + 1), 500);
                });
            };

            createPeer(1);
        });
    }

    private setupPeerListeners() {
        if (!this.peer) return;

        this.peer.on('connection', (conn: any) => {
            this.connections.push(conn);
            
            conn.on('open', () => {
                const currentState = this.callbacks.getCurrentState();
                if (currentState) {
                    conn.send({ type: 'STATE_UPDATE', payload: currentState });
                }
            });

            conn.on('data', (data: any) => {
                this.handleData(conn, data);
            });

            conn.on('close', () => {
                this.connections = this.connections.filter(c => c !== conn);
            });
        });
    }

    private handleData(conn: any, data: any) {
        if (data.type === 'PING') {
            conn.send({
                type: 'PONG',
                payload: {
                    clientSentTime: data.payload,
                    hostTime: Date.now()
                }
            });
            return;
        }

        const currentState = this.callbacks.getCurrentState();
        if (!currentState) return;

        let newState = { ...currentState };
        let changed = false;

        switch (data.type) {
            case 'JOIN':
                const newParticipant = { ...data.payload, isHost: false };
                if (!newState.participants.find((p: PartyParticipant) => p.id === newParticipant.id)) {
                    newState.participants = [...newState.participants, newParticipant];
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
                    const songIndex = newState.currentQueue.findIndex((s: PartyQueueSong) => s.id === data.payload);
                    const song = newState.currentQueue[songIndex];
                    if (song && (song.addedBy === data.senderId)) {
                        this.callbacks.onRemoveSong(data.payload);
                        changed = true;
                    }
                }
                break;
            case 'REACTION':
                const reaction = { id: uuidv4(), emoji: data.payload, senderId: data.senderId || 'anon' };
                newState.reactions = [...newState.reactions.slice(-20), reaction];
                changed = true;
                break;
        }

        if (changed) {
            this.callbacks.onStateChange(newState);
            this.broadcast(newState);
        }
    }

    public broadcast(state: PartyState | null) {
        const message = { type: 'STATE_UPDATE', payload: state };
        this.connections.forEach(conn => {
            if (conn.open) conn.send(message);
        });
    }

    public destroy() {
        this.broadcast(null);
        this.connections.forEach(c => c.close());
        this.connections = [];
        if (this.peer) {
            this.peer.destroy();
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

    constructor(myId: string, callbacks: any) {
        this.myId = myId;
        this.callbacks = callbacks;
    }

    public async join(partyCode: string, name: string, image: string): Promise<{success: boolean, messageKey: string}> {
        this.destroy();
        const targetId = `${PEER_ID_PREFIX}${partyCode.toUpperCase()}`;

        return new Promise((resolve) => {
            const attemptJoin = (retries = 0) => {
                if (retries > 3) {
                    resolve({ success: false, messageKey: 'party.inactive' });
                    return;
                }

                const peer = new Peer(getPeerConfig());
                let connectionMade = false;

                peer.on('open', () => {
                    this.peer = peer;
                    const conn = peer.connect(targetId, { reliable: true });
                    
                    const timeout = setTimeout(() => {
                        if (!connectionMade) {
                            conn.close();
                            peer.destroy();
                            if (retries < 3) {
                                setTimeout(() => attemptJoin(retries + 1), 1000);
                            } else {
                                resolve({ success: false, messageKey: 'party.notFound' });
                            }
                        }
                    }, 5000);

                    conn.on('open', () => {
                        clearTimeout(timeout);
                        connectionMade = true;
                        this.conn = conn;
                        this.setupConnectionListeners();
                        
                        this.send('PING', Date.now());
                        this.send('JOIN', { id: this.myId, name, imageUrl: image });
                        
                        resolve({ success: true, messageKey: 'party.joined' });
                    });

                    conn.on('error', () => {
                         if (!connectionMade) {
                             peer.destroy();
                             setTimeout(() => attemptJoin(retries + 1), 1000);
                         }
                    });
                });

                peer.on('error', () => {
                    if (!connectionMade && retries < 3) {
                        setTimeout(() => attemptJoin(retries + 1), 1000);
                    } else if (!connectionMade) {
                        resolve({ success: false, messageKey: 'party.inactive' });
                    }
                });
            };
            attemptJoin();
        });
    }

    private setupConnectionListeners() {
        if (!this.conn) return;

        this.conn.on('data', (data: any) => {
            if (data.type === 'PONG') {
                const now = Date.now();
                const { clientSentTime, hostTime } = data.payload;
                const latency = (now - clientSentTime) / 2;
                this.timeOffset = (now - latency) - hostTime;
            } else if (data.type === 'STATE_UPDATE') {
                this.callbacks.onStateUpdate(data.payload);
            }
        });

        this.conn.on('close', () => {
            this.callbacks.onConnectionLost();
        });
    }

    public send(type: string, payload: any) {
        if (this.conn && this.conn.open) {
            this.conn.send({ type, payload, senderId: this.myId });
        }
    }

    public destroy() {
        if (this.conn) {
            this.send('LEAVE', null);
            this.conn.close();
            this.conn = null;
        }
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        this.timeOffset = null;
    }
}