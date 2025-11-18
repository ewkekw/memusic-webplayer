

import React, { useState, useContext } from 'react';
import { UserMusicContext } from '../../context/UserMusicContext';
import { Song } from '../../types';
import { useTranslation } from '../../context/LanguageContext';

interface CreatePlaylistFormProps {
    onConfirm: (name: string, description: string) => void;
    onCancel: () => void;
    initialSong?: Song;
}

export const CreatePlaylistForm: React.FC<CreatePlaylistFormProps> = ({ onConfirm, onCancel, initialSong }) => {
    const { playlists } = useContext(UserMusicContext);
    const { t } = useTranslation();
    const [name, setName] = useState(`My Playlist #${playlists.length + 1}`);
    const [description, setDescription] = useState(initialSong ? `Starts with "${initialSong.name}" by ${initialSong.artists.primary.map(a => a.name).join(', ')}` : "");

    const isNameValid = name.trim().length > 0;

    const handleConfirm = () => {
        if (isNameValid) {
            onConfirm(name, description);
        }
    };

    return (
        <>
            <div className="text-gray-300 mb-6 mt-4 space-y-4">
                 <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/10 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fc4b08]"
                    placeholder={t('modals.createPlaylist.namePlaceholder')}
                    aria-label={t('modals.createPlaylist.namePlaceholder')}
                />
                <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-white/10 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-[#fc4b08]"
                    placeholder={t('modals.createPlaylist.descPlaceholder')}
                    aria-label={t('modals.createPlaylist.descPlaceholder')}
                />
            </div>
            <div className="flex justify-end space-x-4">
                 <button onClick={onCancel} className="px-5 py-2.5 rounded-md bg-white/10 hover:bg-white/20 font-semibold transition-colors">{t('modals.createPlaylist.cancel')}</button>
                 <button
                    onClick={handleConfirm}
                    disabled={!isNameValid}
                    className="px-5 py-2.5 rounded-md bg-[#fc4b08] text-black font-bold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                 >
                    {t('modals.createPlaylist.confirm')}
                </button>
            </div>
        </>
    );
};
