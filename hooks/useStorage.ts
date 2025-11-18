
import { useState, useEffect, useCallback } from 'react';
import { AppState } from '../types';
import { useDebounce } from './useDebounce';
import { generateRandomName, defaultAvatars } from '../utils/defaults';

const STORAGE_KEY = 'memusic-v1-storage';
const DEBOUNCE_DELAY = 1000; // Increased delay to reduce write frequency

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

// --- Advanced Type Enforcement ---

const isObject = (item: any): boolean => {
    return (item && typeof item === 'object' && !Array.isArray(item));
};

/**
 * Recursively merges source into target (default), strictly enforcing types from the target.
 * If a key in source matches target but has wrong type, it is reset to target's value.
 * Unknown keys in source are ignored (cleaning up old/bad data).
 */
const strictMerge = (defaults: any, source: any): any => {
    if (source === undefined || source === null) return defaults;
    
    // Strict Type Check: If types don't match, revert to default
    // Exception: Allow null in source if default is object (though usually we want the object) 
    // But for our AppState, we prefer initialized objects over nulls.
    if (typeof defaults !== typeof source) {
        // Special case: Allow upgrading numbers to strings if needed, but here we are strict
        return defaults; 
    }

    if (Array.isArray(defaults)) {
        // For arrays, we trust the source is an array (checked above by typeof)
        // We apply a basic filter to remove nulls/undefineds which might have crept in
        return Array.isArray(source) ? source.filter((i: any) => i !== null && i !== undefined) : defaults;
    }

    if (isObject(defaults)) {
        const output: any = {};
        // Iterate over keys in DEFAULTS (Source of Truth)
        Object.keys(defaults).forEach(key => {
            const defaultValue = defaults[key];
            const sourceValue = source[key];
            
            if (sourceValue === undefined) {
                output[key] = defaultValue;
            } else {
                output[key] = strictMerge(defaultValue, sourceValue);
            }
        });
        return output;
    }

    return source; // Primitive values (string, number, boolean)
};

const validateSpecificLogic = (state: AppState): AppState => {
    // Ensure eqSettings has correct length
    if (state.settings.player.eqSettings.length !== 5) {
        state.settings.player.eqSettings = defaultAppState.settings.player.eqSettings;
    }
    // Ensure current index is valid
    if (state.playerQueue.currentIndex >= state.playerQueue.currentQueue.length) {
        state.playerQueue.currentIndex = -1;
    }
    return state;
}

const loadState = (): AppState => {
    try {
        const serializedState = localStorage.getItem(STORAGE_KEY);
        if (serializedState === null) {
            return defaultAppState;
        }
        const storedState = JSON.parse(serializedState);
        // Strictly enforce structure based on defaultAppState
        const mergedState = strictMerge(defaultAppState, storedState);
        return validateSpecificLogic(mergedState);
    } catch (error) {
        console.error("Failed to load state, resetting to defaults.", error);
        return defaultAppState;
    }
};

// --- Smart Storage Saving with Quota Management ---

const saveState = (state: AppState) => {
    try {
        const serializedState = JSON.stringify(state);
        localStorage.setItem(STORAGE_KEY, serializedState);
    } catch (error: any) {
        if (error.name === 'QuotaExceededError' || error.code === 22 || error.number === -2147024882) {
            console.warn("Storage quota exceeded. Attempting to prune data...");
            
            // Strategy 1: Halve the music history
            if (state.music.history.length > 10) {
                state.music.history = state.music.history.slice(0, Math.floor(state.music.history.length / 2));
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                    console.log("Recovered by pruning music history.");
                    return;
                } catch (e) {}
            }

            // Strategy 2: Clear search history
            if (state.searchHistory.length > 0) {
                state.searchHistory = [];
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                    console.log("Recovered by clearing search history.");
                    return;
                } catch (e) {}
            }

             // Strategy 3: Clear playlist history
             if (state.music.playlistHistory.length > 0) {
                state.music.playlistHistory = [];
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                    console.log("Recovered by clearing playlist history.");
                    return;
                } catch (e) {}
            }
            
            console.error("Critically out of space. Unable to save state even after pruning.");
        } else {
            console.error("Failed to save state to localStorage.", error);
        }
    }
};

export const useStorage = (): [AppState, (updater: (draft: AppState) => void) => void] => {
    const [appState, setAppState] = useState<AppState>(loadState);
    const debouncedState = useDebounce(appState, DEBOUNCE_DELAY);

    // Debounced save
    useEffect(() => {
        saveState(debouncedState);
    }, [debouncedState]);
    
    // Listen for external changes
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && e.newValue) {
                try {
                    // When loading from external change, re-run strict merge for safety
                    const rawNewState = JSON.parse(e.newValue);
                    const validatedState = validateSpecificLogic(strictMerge(defaultAppState, rawNewState));
                    setAppState(validatedState);
                } catch (error) {
                     console.error("Failed to parse state from other tab.", error);
                }
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const updateState = useCallback((updater: (draft: AppState) => void) => {
        setAppState(currentState => {
            try {
                // Modern Deep Clone using structuredClone for performance
                // Fallback to JSON parsing if not available (older browsers)
                const currentDraft: AppState = typeof structuredClone === 'function'
                    ? structuredClone(currentState)
                    : JSON.parse(JSON.stringify(currentState));
                
                updater(currentDraft);
                
                // Runtime Safety: Ensure top-level keys were not accidentally deleted by the updater
                const keys = Object.keys(defaultAppState) as Array<keyof AppState>;
                let isSafe = true;
                for (const key of keys) {
                    if (currentDraft[key] === undefined) {
                        console.warn(`State update missing key: '${key}'. Restoring default.`);
                        (currentDraft as any)[key] = defaultAppState[key];
                        isSafe = false;
                    }
                }
                
                return currentDraft;
            } catch (error) {
                console.error("Critical error during state update. Rollback initiated.", error);
                return currentState;
            }
        });
    }, []);

    return [appState, updateState];
};
