
import React, { createContext, useState, useEffect, useCallback, useContext, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PartyState, PartyMode, PartyParticipant, PartyContextType, Song, PartyQueueSong, PartyReaction } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ProfileContext } from './ProfileContext';
import { PlayerContext } from './PlayerContext';
import { Peer, DataConnection, PeerOptions } from 'peerjs';

export const PartyContext = createContext<PartyContextType>({} as PartyContextType);

const generatePartyCode = () => {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
};

const PEER_ID_PREFIX = 'memusic-party-';

// Robust ICE configuration for cross-network connectivity
// Using a comprehensive list of public STUN servers to maximize connection success chances
const getPeerConfig = (): PeerOptions => ({
    host: '0.peerjs.com',
    port: 443,
    secure: true,
    debug: 1, 
    pingInterval: 5000,
    config: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
            { urls: 'stun:stun.stunprotocol.org:3478' },
            { urls: 'stun:stun.voipstunt.com:3478' },
            { urls: 'stun:stun.xten.com' },
            { urls: 'stun:stun.services.mozilla.com' },
            // Extended list for better NAT traversal
            { urls: 'stun:stun.ekiga.net' },
            { urls: 'stun:stun.ideasip.com' },
            { urls: 'stun:stun.schlund.de' },
            { urls: 'stun:stun.voiparound.com' },
            { urls: 'stun:stun.voipbuster.com' },
            { urls: 'stun:stun.calls.net' },
            { urls: 'stun:stun.counterpath.com' },
            { urls: 'stun:stun.12connect.com' },
            { urls: 'stun:stun.12voip.com' },
            { urls: 'stun:stun.1und1.de' },
            { urls: 'stun:stun.gmx.net' },
        ],
        iceCandidatePoolSize: 10,
    }
});

export const PartyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [partyState, setPartyState] = useState<PartyState | null>(null);
    // myId is the user's persistent identity ID, NOT the PeerJS ID
    const [myId] = useLocalStorage<string>('memusic-party-userId', uuidv4());
    const { name, imageUrl } = useContext(ProfileContext);
    const playerContext = useContext(PlayerContext);
    
    const [partyEndedMessage, setPartyEndedMessage] = useState<{ key: string; replacements?: { [key: string]: string | number } } | null>(null);
    
    // PeerJS Refs
    const peerRef = useRef<Peer | null>(null);
    const connectionsRef = useRef<DataConnection[]>([]); // For Host: list of connected guests
    const hostConnectionRef = useRef<DataConnection | null>(null); // For Guest: connection to host

    // Synchronization Refs
    // timeOffset = GuestTime - HostTime. 
    // Used to convert Host timestamps to local Guest time: LocalTime = HostTime + offset
    const timeOffsetRef = useRef<number | null>(null); 

    // Refs to access latest state inside callbacks/intervals without dependency loops
    const playerContextRef = useRef(playerContext);
    const partyStateRef = useRef(partyState);
    const myIdRef = useRef(myId);
    const nameRef = useRef(name);
    const imageRef = useRef(imageUrl);

    // Sync refs
    useEffect(() => { playerContextRef.current = playerContext; }, [playerContext]);
    useEffect(() => { partyStateRef.current = partyState; }, [partyState]);
    useEffect(() => { myIdRef.current = myId; }, [myId]);
    useEffect(() => { nameRef.current = name; }, [name]);
    useEffect(() => { imageRef.current = imageUrl; }, [imageUrl]);

    const isHost = partyState?.hostId === myId;

    const clearPartyEndedMessage = () => setPartyEndedMessage(null);
    
    // --- PeerJS Logic ---

    const broadcastState = useCallback((state: PartyState | null) => {
        if (connectionsRef.current.length > 0) {
            const message = { type: 'STATE_UPDATE', payload: state };
            connectionsRef.current.forEach(conn => {
                if (conn.open) conn.send(message);
            });
        }
    }, []);

    // Clean up function for PeerJS
    const destroyPeer = useCallback(() => {
        connectionsRef.current.forEach(conn => conn.close());
        connectionsRef.current = [];
        if (hostConnectionRef.current) {
            hostConnectionRef.current.close();
            hostConnectionRef.current = null;
        }
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
        timeOffsetRef.current = null;
    }, []);
    
    const leaveParty = useCallback(() => {
        if (partyState) {
            if (isHost) {
                broadcastState(null); // Notify end
            } else if (hostConnectionRef.current) {
                // Send leave message
                hostConnectionRef.current.send({ type: 'LEAVE', senderId: myId });
            }
        }
        setPartyState(null);
        destroyPeer();
        playerContext.setPlaybackRate(1); // Reset playback speed
    }, [partyState, isHost, broadcastState, myId, destroyPeer, playerContext]);

    const endParty = useCallback(() => {
        leaveParty();
    }, [leaveParty]);


    // --- HOST: Start Party ---
    const startParty = useCallback(async (mode: PartyMode): Promise<string> => {
        // 1. Clean up existing connections
        destroyPeer();

        // 2. Generate Code and Peer ID
        const code = generatePartyCode();
        const hostPeerId = `${PEER_ID_PREFIX}${code}`; // Deterministic ID based on code!

        return new Promise((resolve, reject) => {
            const peer = new Peer(hostPeerId, getPeerConfig());
            
            peer.on('open', (id: string) => {
                console.log('Host Peer Open:', id);
                peerRef.current = peer;
                
                // Initialize State
                const initialState: PartyState = {
                    partyId: code,
                    hostId: myId,
                    mode,
                    participants: [{ id: myId, name: nameRef.current, imageUrl: imageRef.current, isHost: true }],
                    isPlaying: playerContextRef.current.isPlaying,
                    currentSong: playerContextRef.current.currentSong,
                    currentQueue: playerContextRef.current.currentQueue.map(s => ({ ...s, addedBy: myId })),
                    currentTime: playerContextRef.current.currentTime,
                    lastSeekTime: Date.now(),
                    lastStateUpdate: Date.now(),
                    hostPing: Date.now(),
                    reactions: []
                };
                setPartyState(initialState);
                resolve(code);
            });

            peer.on('connection', (conn: DataConnection) => {
                console.log('Host: New connection from', conn.peer);
                connectionsRef.current.push(conn);
                
                conn.on('open', () => {
                    // IMMEDIATE SYNC: Send state right away on connection open
                    if (partyStateRef.current) {
                        conn.send({ type: 'STATE_UPDATE', payload: partyStateRef.current });
                    }
                });

                conn.on('data', (data: any) => {
                    if (data.type === 'PING') {
                        // Respond to Clock Sync PING
                        // Client sent time is reflected back so client can calc latency
                        conn.send({
                            type: 'PONG',
                            payload: {
                                clientSentTime: data.payload,
                                hostTime: Date.now()
                            }
                        });
                    } else {
                        handleActionFromParticipant(data);
                    }
                });

                conn.on('close', () => {
                    connectionsRef.current = connectionsRef.current.filter(c => c !== conn);
                    // Note: We don't automatically remove participants on disconnect to allow reconnection/ghosts,
                    // but user can manually leave.
                });
            });

            peer.on('error', (err: any) => {
                console.error('Peer Error:', err);
                // Handle ID taken (rare with random code)
                if (err.type === 'unavailable-id') {
                     reject(new Error("Code collision, try again"));
                } else {
                     reject(err);
                }
            });
        });
    }, [myId, destroyPeer]);

    // --- GUEST: Join Party ---
    const joinParty = useCallback(async (partyId: string): Promise<{success: boolean, messageKey: string}> => {
        destroyPeer();
        const code = partyId.toUpperCase();
        const targetPeerId = `${PEER_ID_PREFIX}${code}`;
        timeOffsetRef.current = null; // Reset offset on new join

        return new Promise((resolve) => {
             // Guest gets a random peer ID
            const peer = new Peer(getPeerConfig());

            peer.on('open', () => {
                peerRef.current = peer;
                const conn = peer.connect(targetPeerId, { reliable: true });
                
                // Timeout if host doesn't respond
                const timeout = setTimeout(() => {
                    if(!hostConnectionRef.current) {
                        conn.close();
                        resolve({ success: false, messageKey: 'party.notFound' });
                    }
                }, 8000); // Increased timeout for slower networks

                conn.on('open', () => {
                    clearTimeout(timeout);
                    hostConnectionRef.current = conn;
                    
                    // 1. Initiate Time Sync PING immediately
                    conn.send({ type: 'PING', payload: Date.now() });

                    // 2. Send Join Request
                    conn.send({
                        type: 'JOIN',
                        payload: { id: myId, name: nameRef.current, imageUrl: imageRef.current }
                    });
                });

                conn.on('data', (data: any) => {
                    if (data.type === 'PONG') {
                        // Calculate Clock Offset
                        const now = Date.now();
                        const { clientSentTime, hostTime } = data.payload;
                        const latency = (now - clientSentTime) / 2;
                        // Offset = (Now - Latency) - HostTime
                        // Basically: MyClock - HostClock
                        const offset = (now - latency) - hostTime;
                        timeOffsetRef.current = offset;
                        console.log(`Clock synced. Latency: ${latency.toFixed(0)}ms, Offset: ${offset.toFixed(0)}ms`);
                    }
                    else if (data.type === 'STATE_UPDATE') {
                        if (data.payload === null) {
                            // Host ended party
                            setPartyEndedMessage({ key: 'modals.partyEnded.endedByHost', replacements: { partyId: code } });
                            leaveParty();
                        } else {
                            setPartyState(data.payload);
                        }
                    }
                });
                
                conn.on('close', () => {
                     // Only show error if we were actually connected and it wasn't an intentional leave
                     if (hostConnectionRef.current) {
                        setPartyEndedMessage({ key: 'modals.partyEnded.connectionLost', replacements: { partyId: code } });
                        leaveParty();
                     }
                });

                resolve({ success: true, messageKey: 'party.joined' });
            });

            peer.on('error', (err: any) => {
                console.error("Guest Peer Error", err);
                // Only reject if we haven't established connection yet
                if (!hostConnectionRef.current) {
                    resolve({ success: false, messageKey: 'party.notFound' });
                }
            });
        });

    }, [myId, destroyPeer, leaveParty]);


    // --- Host Logic: Sync Loop ---
    useEffect(() => {
        if (!isHost || !partyState) return;
    
        const syncInterval = setInterval(() => {
            const { currentSong, isPlaying, currentTime, currentQueue } = playerContextRef.current;
            
            setPartyState(prev => {
                if (!prev) return prev;
    
                const songChanged = prev.currentSong?.id !== currentSong?.id;
                const playingChanged = prev.isPlaying !== isPlaying;
                const queueChanged = prev.currentQueue.length !== currentQueue.length || 
                                     (prev.currentQueue.length > 0 && prev.currentQueue[0].id !== currentQueue[0].id);
    
                // Note: hostPing is the Host's local time when the update is generated
                const newState: PartyState = {
                    ...prev,
                    currentSong,
                    isPlaying,
                    currentTime,
                    currentQueue: currentQueue.map(s => ({ ...s, addedBy: (s as PartyQueueSong).addedBy || myId })),
                    hostPing: Date.now() 
                };
    
                // Broadcast priorities:
                // 1. Song Change or Play/Pause (Critical)
                // 2. Periodic Sync (every 1s) to keep time aligned
                if (songChanged || playingChanged || queueChanged || Date.now() - prev.lastStateUpdate > 1000) {
                    // Update lastStateUpdate to now (Host Time)
                    const stateToSend = { ...newState, lastStateUpdate: Date.now() };
                    broadcastState(stateToSend);
                    return stateToSend;
                }
                return newState;
            });
    
        }, 250); 
    
        return () => clearInterval(syncInterval);
    }, [isHost, partyState, broadcastState, myId]);


    // --- Guest Logic: Playback Sync & Drift Correction ---
    useEffect(() => {
        if (isHost || !partyState) return;

        const syncPlayback = () => {
            // Wait until we have established the clock offset
            if (timeOffsetRef.current === null) return;

            const state = partyStateRef.current;
            const player = playerContextRef.current;
            if (!state) return;

            const { currentSong, isPlaying, currentTime, lastStateUpdate, currentQueue, partyId } = state;
            
            // 1. Sync Song
            if (currentSong?.id !== player.currentSong?.id) {
                if (currentSong) {
                    console.log("Syncing Song:", currentSong.name);
                    player.playSong(currentSong, currentQueue, { type: 'party', id: partyId });
                    if (player.playbackRate !== 1) player.setPlaybackRate(1);
                    return; 
                }
            }

            // Calculate precise host time in local frame using calculated offset
            // lastStateUpdate is in Host Time.
            // Convert to Local Time: LocalTime = HostTime + Offset
            const localStateUpdateTime = lastStateUpdate + timeOffsetRef.current;
            
            // How much time has passed locally since the host sent that update?
            const secondsPassedSinceUpdate = (Date.now() - localStateUpdateTime) / 1000;
            
            // Estimate where the host is NOW
            const estimatedHostTime = isPlaying ? (currentTime + secondsPassedSinceUpdate) : currentTime;

            // 2. Sync Play/Pause State
            if (isPlaying !== player.isPlaying) {
                if (currentSong?.id === player.currentSong?.id) {
                    if (isPlaying) {
                        // Start playing at the correct time
                        player.seek(estimatedHostTime);
                        player.togglePlay();
                    } else {
                        player.togglePlay();
                    }
                }
            }

            // 3. Drift Correction (Micro-Sync)
            if (isPlaying && player.isPlaying && currentSong?.id === player.currentSong?.id) {
                const drift = estimatedHostTime - player.currentTime; // Positive = We are lagging behind

                // If drift is huge (> 2s), it's likely a seek, network lag spike, or initial join -> Hard Sync
                if (Math.abs(drift) > 2.0) {
                    console.log("Hard Sync. Drift:", drift.toFixed(3));
                    player.seek(estimatedHostTime);
                    if (player.playbackRate !== 1) player.setPlaybackRate(1);
                } 
                // If drift is noticeable (> 0.05s), use playback rate to smooth it out (Micro Sync)
                else if (Math.abs(drift) > 0.05) {
                    // Speed up if lagging, slow down if ahead
                    // Cap the rate change to avoid audio artifacts (0.95x - 1.05x)
                    const targetRate = drift > 0 ? 1.04 : 0.96;
                    if (Math.abs(player.playbackRate - targetRate) > 0.01) {
                        player.setPlaybackRate(targetRate);
                    }
                } else {
                    // In Sync
                    if (player.playbackRate !== 1) {
                         player.setPlaybackRate(1);
                    }
                }
            }
        };

        const interval = setInterval(syncPlayback, 500); // Check sync twice a second
        syncPlayback();

        return () => {
            clearInterval(interval);
            // Reset rate when leaving this effect context (e.g., if song changes or user becomes host)
            if (playerContextRef.current.playbackRate !== 1) {
                playerContextRef.current.setPlaybackRate(1);
            }
        };
    }, [isHost, partyState]);


    // --- Incoming Actions Handler (Host) ---
    const handleActionFromParticipant = useCallback((data: { type: string; payload: any; senderId?: string }) => {
        if (!partyState || !isHost) return;
        
        setPartyState(current => {
            if(!current) return null;
            let newState = { ...current };
            let changed = false;

            switch (data.type) {
                case 'JOIN': // Payload: Participant
                    const newParticipant = { ...data.payload, isHost: false };
                    if (!newState.participants.find(p => p.id === newParticipant.id)) {
                        newState.participants = [...newState.participants, newParticipant];
                        changed = true;
                    }
                    break;
                case 'LEAVE': // Payload: senderId
                     newState.participants = newState.participants.filter(p => p.id !== data.senderId);
                     changed = true;
                     break;
                case 'ADD_SONG':
                    if (newState.mode === 'collaborative') {
                         const songToAdd = { ...data.payload, addedBy: data.senderId };
                         if (!newState.currentQueue.some(s => s.id === songToAdd.id)) {
                             newState.currentQueue = [...newState.currentQueue, songToAdd];
                             changed = true;
                         }
                         // Also update host's actual player
                         playerContextRef.current.addSongsToEnd([songToAdd]);
                    }
                    break;
                case 'REMOVE_SONG':
                    if (newState.mode === 'collaborative') {
                        const songIndex = newState.currentQueue.findIndex(s => s.id === data.payload);
                        const song = newState.currentQueue[songIndex];
                        if (song && (song.addedBy === data.senderId || isHost)) {
                             playerContextRef.current.removeSongFromQueue(data.payload);
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
            
            if (changed) broadcastState(newState);
            return changed ? newState : current;
        });
    }, [partyState, isHost, broadcastState]);

    // --- Helper Actions ---
    
    const sendActionToHost = (type: string, payload: any) => {
        if (isHost) {
            handleActionFromParticipant({ type, payload, senderId: myId });
        } else if (hostConnectionRef.current) {
            hostConnectionRef.current.send({ type, payload, senderId: myId });
        }
    };

    const togglePartyPlayer = () => {
        if (isHost || partyState?.mode === 'collaborative') {
            if(isHost) playerContext.togglePlay();
        }
    };

    const playNextParty = () => isHost && playerContext.playNext();
    const playPrevParty = () => isHost && playerContext.playPrev();
    const seekPartyPlayer = (time: number) => isHost && playerContext.seek(time);

    const addSongToPartyQueue = (song: Song) => sendActionToHost('ADD_SONG', song);
    const removeSongFromPartyQueue = (songId: string) => sendActionToHost('REMOVE_SONG', songId);
    const reorderPartyQueue = (oldIndex: number, newIndex: number) => { /* TODO: Implement reorder sync */ };
    const sendReaction = (emoji: string) => sendActionToHost('REACTION', emoji);

    return (
        <PartyContext.Provider value={{
            partyState, isHost, myId,
            startParty, joinParty, leaveParty, endParty,
            seekPartyPlayer, togglePartyPlayer, playNextParty, playPrevParty,
            addSongToPartyQueue, removeSongFromPartyQueue, reorderPartyQueue, sendReaction,
            partyEndedMessage, clearPartyEndedMessage
        }}>
            {children}
        </PartyContext.Provider>
    );
};
