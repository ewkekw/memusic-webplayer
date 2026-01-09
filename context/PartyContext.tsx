
import React, { createContext, useState, useEffect, useCallback, useContext, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PartyState, PartyMode, PartyContextType, Song, PartyQueueSong } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ProfileContext } from './ProfileContext';
import { PlayerContext } from './PlayerContext';
import { PartyHost, PartyGuest } from '../services/PartyLogic';
import { synchronizePlayback } from '../services/PartySync';

export const PartyContext = createContext<PartyContextType>({} as PartyContextType);

export const PartyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [partyState, setPartyState] = useState<PartyState | null>(null);
    const [myId] = useLocalStorage<string>('memusic-party-userId', uuidv4());
    const { name, imageUrl } = useContext(ProfileContext);
    const playerContext = useContext(PlayerContext);
    
    const [partyEndedMessage, setPartyEndedMessage] = useState<{ key: string; replacements?: { [key: string]: string | number } } | null>(null);
    
    const hostRef = useRef<PartyHost | null>(null);
    const guestRef = useRef<PartyGuest | null>(null);
    
    const playerContextRef = useRef(playerContext);
    const partyStateRef = useRef(partyState);
    
    useEffect(() => { playerContextRef.current = playerContext; }, [playerContext]);
    useEffect(() => { partyStateRef.current = partyState; }, [partyState]);

    const isHost = partyState?.hostId === myId;

    const clearPartyEndedMessage = () => setPartyEndedMessage(null);

    const hostCallbacks = {
        getCurrentState: () => partyStateRef.current,
        onStateChange: (newState: PartyState) => setPartyState(newState),
        onAddSongs: (songs: Song[]) => playerContextRef.current.addSongsToEnd(songs),
        onRemoveSong: (id: string) => playerContextRef.current.removeSongFromQueue(id)
    };

    const guestCallbacks = {
        onStateUpdate: (newState: PartyState | null) => {
            if (newState === null) {
                setPartyEndedMessage({ key: 'modals.partyEnded.endedByHost', replacements: { partyId: partyStateRef.current?.partyId || '' } });
                leaveParty();
            } else {
                setPartyState(newState);
            }
        },
        onConnectionLost: () => {
             if (partyStateRef.current) {
                setPartyEndedMessage({ key: 'modals.partyEnded.connectionLost', replacements: { partyId: partyStateRef.current?.partyId || '' } });
                leaveParty();
            }
        }
    };

    const startParty = useCallback(async (mode: PartyMode, onStatusUpdate?: (status: string) => void): Promise<string> => {
        if (guestRef.current) guestRef.current.destroy();
        
        hostRef.current = new PartyHost(myId, hostCallbacks);
        
        return await hostRef.current.start(
            mode, 
            name, 
            imageUrl, 
            {
                isPlaying: playerContext.isPlaying,
                currentSong: playerContext.currentSong,
                currentQueue: playerContext.currentQueue,
                currentTime: playerContext.currentTime
            },
            onStatusUpdate
        );
    }, [myId, name, imageUrl, playerContext]);

    const joinParty = useCallback(async (partyId: string): Promise<{success: boolean, messageKey: string, errorMessage?: string}> => {
        if (hostRef.current) hostRef.current.destroy();
        if (guestRef.current) guestRef.current.destroy();

        guestRef.current = new PartyGuest(myId, guestCallbacks);
        return await guestRef.current.join(partyId, name, imageUrl);
    }, [myId, name, imageUrl]);

    const leaveParty = useCallback(() => {
        if (hostRef.current) {
            hostRef.current.destroy();
            hostRef.current = null;
        }
        if (guestRef.current) {
            guestRef.current.destroy();
            guestRef.current = null;
        }
        setPartyState(null);
        playerContext.setPlaybackRate(1);
    }, [playerContext]);

    const endParty = useCallback(() => {
        leaveParty();
    }, [leaveParty]);

    useEffect(() => {
        if (!isHost || !partyState || !hostRef.current) return;

        const syncInterval = setInterval(() => {
            const { currentSong, isPlaying, currentTime, currentQueue } = playerContextRef.current;
            
            setPartyState(prev => {
                if (!prev) return prev;

                const songChanged = prev.currentSong?.id !== currentSong?.id;
                const playingChanged = prev.isPlaying !== isPlaying;
                const queueChanged = prev.currentQueue.length !== currentQueue.length || 
                                     (prev.currentQueue.length > 0 && currentQueue.length > 0 && prev.currentQueue[0].id !== currentQueue[0].id);

                const newState: PartyState = {
                    ...prev,
                    currentSong,
                    isPlaying,
                    currentTime,
                    currentQueue: currentQueue.map(s => ({ ...s, addedBy: (s as PartyQueueSong).addedBy || myId })),
                    hostPing: Date.now() 
                };

                if (songChanged || playingChanged || queueChanged || Date.now() - prev.lastStateUpdate > 1500) {
                    const stateToSend = { ...newState, lastStateUpdate: Date.now() };
                    hostRef.current?.broadcast(stateToSend);
                    return stateToSend;
                }
                return newState;
            });
        }, 250);

        return () => clearInterval(syncInterval);
    }, [isHost, partyState, myId]);

    useEffect(() => {
        if (isHost || !partyState || !guestRef.current) return;

        const syncInterval = setInterval(() => {
            synchronizePlayback(partyState, playerContextRef.current, guestRef.current?.timeOffset || null);
        }, 500);

        const pingInterval = setInterval(() => {
            if (guestRef.current) {
                guestRef.current.send('PING', Date.now());
            }
        }, 2000);

        synchronizePlayback(partyState, playerContextRef.current, guestRef.current?.timeOffset || null);

        return () => {
            clearInterval(syncInterval);
            clearInterval(pingInterval);
            if (playerContextRef.current.playbackRate !== 1) {
                playerContextRef.current.setPlaybackRate(1);
            }
        };
    }, [isHost, partyState]);

    const togglePartyPlayer = () => {
        if (isHost || partyState?.mode === 'collaborative') {
            if(isHost) playerContext.togglePlay();
            else {
            }
        }
    };

    const playNextParty = () => isHost && playerContext.playNext();
    const playPrevParty = () => isHost && playerContext.playPrev();
    const seekPartyPlayer = (time: number) => isHost && playerContext.seek(time);

    const addSongToPartyQueue = (song: Song) => {
        if (isHost) {
            const songToAdd = { ...song, addedBy: myId };
            playerContext.addSongsToEnd([songToAdd]);
            setPartyState(prev => {
                if (!prev) return null;
                const newState = { ...prev, currentQueue: [...prev.currentQueue, songToAdd] };
                hostRef.current?.broadcast(newState);
                return newState;
            });
        } else {
            guestRef.current?.send('ADD_SONG', song);
        }
    };

    const removeSongFromPartyQueue = (songId: string) => {
        if (isHost) {
            playerContext.removeSongFromQueue(songId);
            setPartyState(prev => {
                if (!prev) return null;
                const newState = { ...prev, currentQueue: prev.currentQueue.filter(s => s.id !== songId) };
                hostRef.current?.broadcast(newState);
                return newState;
            });
        } else {
            guestRef.current?.send('REMOVE_SONG', songId);
        }
    };

    const reorderPartyQueue = (oldIndex: number, newIndex: number) => {};
    
    const sendReaction = (emoji: string) => {
        if (isHost) {
            setPartyState(prev => {
                if (!prev) return null;
                const reaction = { id: uuidv4(), emoji, senderId: myId };
                const newState = { ...prev, reactions: [...prev.reactions.slice(-20), reaction] };
                hostRef.current?.broadcast(newState);
                return newState;
            });
        } else {
            guestRef.current?.send('REACTION', emoji);
        }
    };

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
