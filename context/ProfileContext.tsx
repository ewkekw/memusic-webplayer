

import React, { createContext, useCallback } from 'react';
import { ProfileContextType, ProfileData, AppState } from '../types';
import { defaultAppState } from '../hooks/useStorage';

export const ProfileContext = createContext<ProfileContextType>({} as ProfileContextType);

interface ProfileProviderProps {
    children: React.ReactNode;
    profile: ProfileData;
    setAppState: (updater: (draft: AppState) => void) => void;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children, profile, setAppState }) => {
    const safeProfile = (profile && typeof profile.name === 'string' && typeof profile.imageUrl === 'string') 
        ? profile 
        : defaultAppState.profile;
    
    const { name, imageUrl } = safeProfile;

    const updateName = useCallback((newName: string) => {
        const trimmedName = newName.trim();
        if (trimmedName) {
            setAppState(draft => {
                draft.profile.name = trimmedName;
            });
        }
    }, [setAppState]);
    
    const updateImage = useCallback((newImageUrl: string) => {
        setAppState(draft => {
            draft.profile.imageUrl = newImageUrl;
        });
    }, [setAppState]);

    return (
        <ProfileContext.Provider value={{ name, imageUrl, updateName, updateImage }}>
            {children}
        </ProfileContext.Provider>
    );
};