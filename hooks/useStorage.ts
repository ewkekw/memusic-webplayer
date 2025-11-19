
import { useState, useEffect, useCallback } from 'react';
import { AppState } from '../types';
import { useDebounce } from './useDebounce';
import { generateRandomName, defaultAvatars } from '../utils/defaults';

const STORAGE_KEY = 'memusic-v1-storage';
const DEBOUNCE_DELAY = 1000;

const eqBands = [
    { f: 60, type: 'lowshelf' as const }, { f: 230, type: 'peaking' as const },
    { f: 910, type: 'peaking' as const }, { f: 3600, type: 'peaking' as const },
    { f: 14000, type: 'highshelf' as const },
];

export const defaultAppState: AppState = {
    version: 1,
    profile: {
        name: generateRandomName(),
        imageUrl: defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)],
    },
    settings: {
        language: 'en',
        player: {
            volume: 1,
            selectedQuality: '320kbps',
            isShuffle: false,
            repeatMode: 'off',
            eqSettings: eqBands.map(() => ({ gain: 0 })),
            isEqEnabled: false,
            is8DEnabled: false,
            isReverbEnabled: false,
            reverbMix: 0.3,
        },
    },
    music: {
        favoriteSongs: [],
        favoriteAlbums: [],
        playlists: [],
        history: [],
        playlistHistory: [],
        favoriteApiPlaylists: [],
        favoriteArtists: [],
    },
    playerQueue: {
        currentQueue: [],
        currentIndex: -1,
        contextType: null,
        contextId: null,
        originalQueueUnshuffled: null,
    },
    searchHistory: [],
};

const isObject = (item: any): boolean => (item && typeof item === 'object' && !Array.isArray(item));

const strictMerge = (defaults: any, source: any): any => {
    if (source === undefined || source === null) return defaults;
    if (typeof defaults !== typeof source) return defaults;

    if (Array.isArray(defaults)) {
        return Array.isArray(source) ? source.filter((i: any) => i !== null && i !== undefined) : defaults;
    }

    if (isObject(defaults)) {
        const output: any = {};
        Object.keys(defaults).forEach(key => {
            output[key] = source[key] === undefined ? defaults[key] : strictMerge(defaults[key], source[key]);
        });
        return output;
    }

    return source;
};

const validateSpecificLogic = (state: AppState): AppState => {
    if (state.settings.player.eqSettings.length !== 5) state.settings.player.eqSettings = defaultAppState.settings.player.eqSettings;
    if (state.playerQueue.currentIndex >= state.playerQueue.currentQueue.length) state.playerQueue.currentIndex = -1;
    return state;
}

const loadState = (): AppState => {
    try {
        const serializedState = localStorage.getItem(STORAGE_KEY);
        if (serializedState === null) return defaultAppState;
        return validateSpecificLogic(strictMerge(defaultAppState, JSON.parse(serializedState)));
    } catch (error) {
        console.error("Failed to load state, resetting.", error);
        return defaultAppState;
    }
};

const saveState = (state: AppState) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error: any) {
        if (error.name === 'QuotaExceededError' || error.code === 22) {
            console.warn("Storage quota exceeded. Pruning data...");
            
            if (state.music.history.length > 10) {
                state.music.history = state.music.history.slice(0, Math.floor(state.music.history.length / 2));
                saveState(state);
                return;
            }
            if (state.searchHistory.length > 0) {
                state.searchHistory = [];
                saveState(state);
                return;
            }
             if (state.music.playlistHistory.length > 0) {
                state.music.playlistHistory = [];
                saveState(state);
                return;
            }
        }
        console.error("Failed to save state.", error);
    }
};

export const useStorage = (): [AppState, (updater: (draft: AppState) => void) => void] => {
    const [appState, setAppState] = useState<AppState>(loadState);
    const debouncedState = useDebounce(appState, DEBOUNCE_DELAY);

    useEffect(() => { saveState(debouncedState); }, [debouncedState]);
    
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && e.newValue) {
                try {
                    setAppState(validateSpecificLogic(strictMerge(defaultAppState, JSON.parse(e.newValue))));
                } catch (error) { console.error("Failed to sync state.", error); }
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const updateState = useCallback((updater: (draft: AppState) => void) => {
        setAppState(currentState => {
            try {
                const currentDraft: AppState = typeof structuredClone === 'function'
                    ? structuredClone(currentState)
                    : JSON.parse(JSON.stringify(currentState));
                
                updater(currentDraft);
                
                // Check for accidental deletions of top-level keys
                for (const key of Object.keys(defaultAppState) as Array<keyof AppState>) {
                    if (currentDraft[key] === undefined) {
                        (currentDraft as any)[key] = defaultAppState[key];
                    }
                }
                return currentDraft;
            } catch (error) {
                console.error("State update error.", error);
                return currentState;
            }
        });
    }, []);

    return [appState, updateState];
};
