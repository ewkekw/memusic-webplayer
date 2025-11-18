

import React, { createContext, useState, useEffect, useCallback, useContext, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PartyState, PartyMode, PartyParticipant, PartyContextType, Song, PartyQueueSong, PartyReaction } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ProfileContext } from './ProfileContext';
import { PlayerContext } from './PlayerContext';

export const PartyContext = createContext<PartyContextType>({} as PartyContextType);

const generatePartyId = () => {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
};

export const PartyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [partyState, setPartyState] = useState<PartyState | null>(null);
    const [myId] = useLocalStorage<string>('memusic-party-userId', uuidv4());
    const { name, imageUrl } = useContext(ProfileContext);
    const playerContext = useContext(PlayerContext);
    
    const [partyEndedMessage, setPartyEndedMessage] = useState<{ key: string; replacements?: { [key: string]: string | number } } | null>(null);
    
    const channelRef = useRef<BroadcastChannel | null>(null);
    const isHost = partyState?.hostId === myId;

    const playerContextRef = useRef(playerContext);
    useEffect(() => {
        playerContextRef.current = playerContext;
    }, [playerContext]);

    const clearPartyEndedMessage = () => setPartyEndedMessage(null);
    
    const broadcastState = useCallback((state: PartyState | null) => {
        if (channelRef.current) {
            channelRef.current.postMessage({ type: 'STATE_UPDATE', payload: state });
        }
        if (state) {
            localStorage.setItem(`party-${state.partyId}`, JSON.stringify(state));
        }
    }, []);
    
    const updatePartyState = useCallback((updater: (prevState: PartyState) => PartyState) => {
        setPartyState(prev => {
            if (!prev) return null;
            const newState = updater(prev);
            newState.lastStateUpdate = Date.now();
            broadcastState(newState);
            return newState;
        });
    }, [broadcastState]);

    // Host: Syncs local PlayerContext state TO the shared partyState
    useEffect(() => {
        if (!isHost || !partyState) return;
    
        const syncInterval = setInterval(() => {
            const { currentSong, isPlaying, currentTime, currentQueue } = playerContextRef.current;
            
            setPartyState(prev => {
                if (!prev) return prev;
    
                const songChanged = prev.currentSong?.id !== currentSong?.id;
                const playingChanged = prev.isPlaying !== isPlaying;
                const queueChanged = JSON.stringify(prev.currentQueue.map(s => s.id)) !== JSON.stringify(currentQueue.map(s => s.id));
    
                const newState: PartyState = {
                    ...prev,
                    currentSong,
                    isPlaying,
                    currentTime,
                    currentQueue: currentQueue.map(s => ({ ...s, addedBy: (s as PartyQueueSong).addedBy || myId })),
                    hostPing: Date.now()
                };
    
                // If a critical change happened, or if it's been a while, broadcast.
                if (songChanged || playingChanged || queueChanged || Date.now() - prev.lastStateUpdate > 1000) {
                    broadcastState(newState);
                    return { ...newState, lastStateUpdate: Date.now() };
                }
                
                // If no broadcast, just update local state with new time/ping
                return newState;
            });
    
        }, 250); // Sync more frequently, every 250ms.
    
        return () => clearInterval(syncInterval);
    }, [isHost, partyState, broadcastState, myId]);


    // Participant: Watches for host disconnection
    useEffect(() => {
        if (isHost || !partyState) return;

        const intervalId = setInterval(() => {
            if (partyState.hostPing && (Date.now() - partyState.hostPing > 15000)) { // 15s timeout
                setPartyEndedMessage({ key: 'modals.partyEnded.connectionLost', replacements: { partyId: partyState.partyId } });
                leaveParty();
            }
        }, 5000); // Check every 5s

        return () => clearInterval(intervalId);
    }, [isHost, partyState]);

    // Listener: Robust Sync with Host State (with Drift Correction)
    useEffect(() => {
        if (isHost || !partyState) return;

        const sync = () => {
            const { currentSong, isPlaying, currentTime, lastStateUpdate, currentQueue } = partyState;
            const player = playerContextRef.current;
            
            // 1. Sync Song
            if (currentSong?.id !== player.currentSong?.id) {
                if (currentSong) {
                    player.playSong(currentSong, currentQueue, { type: 'party', id: partyState.partyId });
                    player.setPlaybackRate(1); // Reset rate on new song
                    return; // Wait for song to load
                }
            }

            // 2. Sync Play State
            if (isPlaying !== player.isPlaying) {
                if (isPlaying) {
                    // Host is playing, we are paused. Sync time then play.
                    const targetTime = currentTime + (Date.now() - lastStateUpdate) / 1000;
                    if (Math.abs(player.currentTime - targetTime) > 0.5) {
                         player.seek(targetTime);
                    }
                    player.togglePlay();
                } else {
                    // Host paused, we pause.
                    player.togglePlay();
                }
            }

            // 3. Sync Time (Smart Drift Correction)
            if (isPlaying && player.isPlaying) {
                // Estimate where the host is *right now*
                const estimatedHostTime = currentTime + (Date.now() - lastStateUpdate) / 1000;
                const drift = estimatedHostTime - player.currentTime; // Positive = We are behind

                if (Math.abs(drift) > 2.5) {
                    // Large drift: Hard seek
                    player.seek(estimatedHostTime);
                    player.setPlaybackRate(1);
                } else if (Math.abs(drift) > 0.15) {
                    // Small drift: Adjust playback rate to catch up or slow down smoothly
                    // If behind (drift > 0), speed up (1.05x). If ahead, slow down (0.95x).
                    const rate = drift > 0 ? 1.05 : 0.95;
                    // Only update if significantly different to avoid jitter
                    if (Math.abs(player.playbackRate - rate) > 0.01) {
                         player.setPlaybackRate(rate);
                    }
                } else {
                    // In sync
                    if (player.playbackRate !== 1) player.setPlaybackRate(1);
                }
            }
        };

        const interval = setInterval(sync, 1000); // Check sync every second
        sync(); // Run immediately

        return () => {
            clearInterval(interval);
            // Reset rate when component unmounts or conditions change
            if (playerContextRef.current.playbackRate !== 1) {
                playerContextRef.current.setPlaybackRate(1);
            }
        };
    }, [isHost, partyState]);

    const handleActionFromParticipant = useCallback((action: { type: string; payload: any; senderId: string }) => {
        if (!partyState || !isHost) return;
        
        switch (action.type) {
            case 'TOGGLE_PLAY':
                playerContext.togglePlay();
                break;
            case 'SEEK':
                playerContext.seek(action.payload.time);
                break;
            case 'PLAY_NEXT':
                playerContext.playNext();
                break;
            case 'PLAY_PREV':
                playerContext.playPrev();
                break;
            case 'ADD_SONG':
                updatePartyState(prev => {
                    const newSong: PartyQueueSong = { ...action.payload.song, addedBy: action.senderId };
                    const queue = prev.currentQueue.some(s => s.id === newSong.id) ? prev.currentQueue : [...prev.currentQueue, newSong];
                    // Update player context's queue as well
                    playerContext.addSongsToEnd([action.payload.song]);
                    return { ...prev, currentQueue: queue };
                });
                break;
            case 'REMOVE_SONG':
                playerContext.removeSongFromQueue(action.payload.songId);
                break;
            case 'REORDER_QUEUE':
                playerContext.reorderQueue(action.payload.oldIndex, action.payload.newIndex);
                break;
            case 'SEND_REACTION':
                updatePartyState(prev => {
                    const newReaction: PartyReaction = {
                        id: uuidv4(),
                        emoji: action.payload.emoji,
                        senderId: action.senderId
                    };
                    // Keep the reactions array from growing too large.
                    return { ...prev, reactions: [...prev.reactions.slice(-19), newReaction] };
                });
                break;
            case 'UPDATE_PROFILE':
                updatePartyState(prev => ({
                    ...prev,
                    participants: prev.participants.map(p => 
                        p.id === action.senderId 
                            ? { ...p, name: action.payload.name, imageUrl: action.payload.imageUrl }
                            : p
                    )
                }));
                break;
        }
    }, [partyState, isHost, playerContext, updatePartyState]);

    const handleMessage = useCallback((event: MessageEvent) => {
        const { type, payload } = event.data;
        switch (type) {
            case 'STATE_UPDATE':
                if (payload === null && partyState) {
                    setPartyEndedMessage({ key: 'modals.partyEnded.endedByHost', replacements: { partyId: partyState.partyId } });
                }
                setPartyState(payload);
                break;
            case 'ACTION':
                if (isHost) handleActionFromParticipant(payload);
                break;
        }
    }, [isHost, handleActionFromParticipant, partyState]);

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (partyState && e.key === `party-${partyState.partyId}` && e.newValue === null) {
                // Party was ended by host closing tab/deleting storage item
                setPartyEndedMessage({ key: 'modals.partyEnded.ended', replacements: { partyId: partyState.partyId } });
                leaveParty();
            }
        }
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [partyState]);
    
    const sendAction = (action: any) => {
        if (channelRef.current) {
            channelRef.current.postMessage({ type: 'ACTION', payload: { ...action, senderId: myId } });
        }
    }
    
    // --- Profile Synchronization Logic ---
    useEffect(() => {
        if (!partyState) return;
        
        const meInParty = partyState.participants.find(p => p.id === myId);
        
        // If I am in the party and my local profile (name/image) differs from what is in the party state...
        if (meInParty && (meInParty.name !== name || meInParty.imageUrl !== imageUrl)) {
            if (isHost) {
                // If I am host, I can update the state directly
                updatePartyState(prev => ({
                    ...prev,
                    participants: prev.participants.map(p => 
                        p.id === myId ? { ...p, name, imageUrl } : p
                    )
                }));
            } else {
                // If I am a guest, I must ask the host to update my profile
                sendAction({ type: 'UPDATE_PROFILE', payload: { name, imageUrl } });
            }
        }
    }, [partyState, name, imageUrl, myId, isHost, updatePartyState]);


    const startParty = (mode: PartyMode): string => {
        const partyId = generatePartyId();
        const me: PartyParticipant = { id: myId, name, imageUrl, isHost: true };
        const initialState: PartyState = {
            partyId,
            hostId: myId,
            mode,
            participants: [me],
            isPlaying: playerContext.isPlaying,
            currentSong: playerContext.currentSong,
            currentQueue: (playerContext.currentQueue || []).map(s => ({...s, addedBy: myId})),
            currentTime: playerContext.currentTime,
            lastSeekTime: 0,
            lastStateUpdate: Date.now(),
            hostPing: Date.now(),
            reactions: [],
        };
        setPartyState(initialState);
        localStorage.setItem(`party-${partyId}`, JSON.stringify(initialState));
        
        channelRef.current = new BroadcastChannel(`party-${partyId}`);
        channelRef.current.onmessage = handleMessage;
        return partyId;
    };
    
    const joinParty = async (partyId: string): Promise<{success: boolean, messageKey: string}> => {
        const partyData = localStorage.getItem(`party-${partyId}`);
        if (!partyData) {
            return { success: false, messageKey: "party.notFound" };
        }
        
        const existingState: PartyState = JSON.parse(partyData);
        if (Date.now() - existingState.hostPing > 15000) {
            localStorage.removeItem(`party-${partyId}`);
            return { success: false, messageKey: "party.inactive" };
        }

        const me: PartyParticipant = { id: myId, name, imageUrl, isHost: false };
        
        channelRef.current = new BroadcastChannel(`party-${partyId}`);
        channelRef.current.onmessage = handleMessage;

        const newState: PartyState = {
            ...existingState,
            participants: [...existingState.participants.filter(p => p.id !== myId), me]
        };
        setPartyState(newState);
        broadcastState(newState);
        
        return { success: true, messageKey: "party.joined" };
    };
    
    const leaveOrEndParty = (isEnding: boolean) => {
        if (!partyState) return;
        const partyId = partyState.partyId;

        if (isHost && isEnding) {
            localStorage.removeItem(`party-${partyId}`);
            if (channelRef.current) {
                channelRef.current.postMessage({ type: 'STATE_UPDATE', payload: null });
            }
        } else {
            updatePartyState(prev => ({
                ...prev,
                participants: prev.participants.filter(p => p.id !== myId)
            }));
        }

        if(channelRef.current) {
            channelRef.current.close();
            channelRef.current = null;
        }
        setPartyState(null);
        // Reset playback rate when leaving
        playerContext.setPlaybackRate(1);
    }

    const leaveParty = () => leaveOrEndParty(false);
    const endParty = () => leaveOrEndParty(true);
    
    const sendReaction = (emoji: string) => {
        if (!partyState) return;

        if (isHost) {
            // Host can update state directly and it will be broadcast.
            updatePartyState(prev => {
                const newReaction: PartyReaction = {
                    id: uuidv4(),
                    emoji: emoji,
                    senderId: myId
                };
                return { ...prev, reactions: [...prev.reactions.slice(-19), newReaction] };
            });
        } else {
            // Participants send an action to the host.
            sendAction({ type: 'SEND_REACTION', payload: { emoji } });
        }
    };

    const seekPartyPlayer = (time: number) => {
        if (!partyState) return;
        if (isHost) {
            playerContext.seek(time);
        } else if (partyState.mode === 'collaborative') {
            sendAction({ type: 'SEEK', payload: { time } });
        }
    }
    const togglePartyPlayer = () => {
        if (!partyState) return;
        if (isHost) {
            playerContext.togglePlay();
        } else if (partyState.mode === 'collaborative') {
            sendAction({ type: 'TOGGLE_PLAY' });
        }
    }
    const playNextParty = () => {
        if (!partyState) return;
        if (isHost) {
            playerContext.playNext();
        } else if (partyState.mode === 'collaborative') {
            sendAction({ type: 'PLAY_NEXT' });
        }
    }
    const playPrevParty = () => {
        if (!partyState) return;
        if (isHost) {
            playerContext.playPrev();
        } else if (partyState.mode === 'collaborative') {
            sendAction({ type: 'PLAY_PREV' });
        }
    }
    const addSongToPartyQueue = (song: Song) => {
        if (!partyState) return;
        if (isHost || partyState.mode === 'collaborative') {
            sendAction({ type: 'ADD_SONG', payload: { song } });
        }
    }
    const removeSongFromPartyQueue = (songId: string) => {
        if (!partyState) return;
        if (isHost || partyState.mode === 'collaborative') {
            sendAction({ type: 'REMOVE_SONG', payload: { songId } });
        }
    }
    const reorderPartyQueue = (oldIndex: number, newIndex: number) => {
        if (!partyState) return;
        if(isHost || partyState.mode === 'collaborative') {
            sendAction({ type: 'REORDER_QUEUE', payload: { oldIndex, newIndex } });
        }
    }

    return (
        <PartyContext.Provider value={{ partyState, isHost, myId, startParty, joinParty, leaveParty, endParty, seekPartyPlayer, togglePartyPlayer, playNextParty, playPrevParty, addSongToPartyQueue, removeSongFromPartyQueue, reorderPartyQueue, sendReaction, partyEndedMessage, clearPartyEndedMessage }}>
            {children}
        </PartyContext.Provider>
    );
};