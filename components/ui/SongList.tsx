
import React, { useContext, useState, useRef, useEffect } from 'react';
import { Song } from '../../types';
import { PlayerContext } from '../../context/PlayerContext';
import { PlayerContextTypeString } from '../../types';
import { UserMusicContext } from '../../context/UserMusicContext';
import { ModalContext } from '../../context/ModalContext';
import { CreatePlaylistForm } from './CreatePlaylistForm';
import { useTranslation } from '../../context/LanguageContext';
import { SmartMenu } from './SmartMenu';

const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 3l14 9-14 9V3z" />
  </svg>
);
const PauseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" rx="2" />
    <rect x="14" y="4" width="4" height="16" rx="2" />
  </svg>
);
const HeartIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);
const MoreIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
    </svg>
);
const RadioIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2" />
        <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
    </svg>
);

const formatDuration = (seconds: number | null) => {
    if (seconds === null) return '-:--';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

interface SongListItemProps {
  song: Song;
  index: number;
  songs: Song[];
  playlistId?: string;
  context: { type: PlayerContextTypeString; id: string; };
  navigateToArtist: (artistId: string) => void;
  onInteraction?: () => void;
  navigateToPlaylist?: (playlistId: string) => void;
}

const SongListItem: React.FC<SongListItemProps> = React.memo(({ song, index, songs, playlistId, context, navigateToArtist, onInteraction, navigateToPlaylist }) => {
    const { playSong, addSongNext, addSongsToEnd, playRadio, currentSong, isPlaying } = useContext(PlayerContext);
    const { isFavoriteSong, toggleFavoriteSong, removeSongFromPlaylist, playlists, createPlaylist, addSongToPlaylist } = useContext(UserMusicContext);
    const { showModal, hideModal } = useContext(ModalContext);
    const { t } = useTranslation();
    const [activeMenu, setActiveMenu] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    
    const isPlayingCurrent = currentSong?.id === song.id;

    const handlePlay = () => {
        onInteraction?.();
        if (context.type === 'search') {
            playSong(song, [song], context);
        } else {
            playSong(song, songs, context);
        }
    }
    
    const handleMenuAction = (action: () => void) => {
        onInteraction?.();
        action();
        setActiveMenu(false);
    };

    const handleCreateNewPlaylist = (songToAdd: Song) => {
        showModal({
            title: t('modals.createPlaylist.title'),
            content: <CreatePlaylistForm initialSong={songToAdd} onCancel={hideModal} onConfirm={(name, desc) => {
                const newPlaylist = createPlaylist(name, desc, [songToAdd]);
                hideModal();
                if (navigateToPlaylist) navigateToPlaylist(newPlaylist.id);
            }} />,
        });
    };

    const imageUrl = song.image?.find(img => img.quality === '50x50')?.url || song.image?.[0]?.url;

    return (
        <div onMouseLeave={() => setActiveMenu(false)} className={`group flex items-center p-3 rounded-xl transition-all duration-200 border border-transparent ${isPlayingCurrent ? 'bg-white/10 border-white/5' : 'hover:bg-white/5 hover:border-white/5'} cursor-pointer`}>
            <div className={`w-8 text-center mr-4 flex-shrink-0 font-medium ${isPlayingCurrent ? 'text-[#fc4b08]' : 'text-gray-500 group-hover:hidden'}`}>
                {isPlayingCurrent ? (
                    isPlaying ? <PauseIcon className="w-4 h-4 mx-auto text-[#fc4b08]" /> : <PlayIcon className="w-4 h-4 mx-auto text-[#fc4b08]" />
                ) : index + 1}
            </div>
            <button onClick={handlePlay} className={`w-8 h-8 items-center justify-center rounded-full text-white mr-4 flex-shrink-0 bg-[#fc4b08] shadow-lg shadow-[#fc4b08]/30 ${isPlayingCurrent ? 'hidden' : 'hidden group-hover:flex animate-in zoom-in'}`}><PlayIcon className="w-4 h-4 ml-0.5" /></button>
            
            <img src={imageUrl} alt={song.name} className={`w-12 h-12 rounded-lg mr-4 flex-shrink-0 object-cover shadow-sm transition-transform duration-300 ${isPlayingCurrent ? 'scale-105 shadow-[#fc4b08]/20' : 'group-hover:scale-105'}`} loading="lazy" />
            
            <div className="flex-1 min-w-0" onClick={handlePlay}>
                <p className={`font-semibold leading-snug line-clamp-1 ${isPlayingCurrent ? 'text-[#fc4b08]' : 'text-white'}`} title={song.name}>{song.name}</p>
                <p className="text-sm text-gray-400 truncate leading-snug">
                    {song.artists.primary.map((artist, i) => (<React.Fragment key={artist.id}><span onClick={(e) => { e.stopPropagation(); navigateToArtist(artist.id); }} className="hover:text-white hover:underline cursor-pointer transition-colors">{artist.name}</span>{i < song.artists.primary.length - 1 && ', '}</React.Fragment>))}
                </p>
            </div>
            <div className="flex items-center space-x-2 ml-4 relative">
                <button onClick={(e) => { e.stopPropagation(); handleMenuAction(() => toggleFavoriteSong(song)); }} className="text-gray-400 hover:text-[#fc4b08] p-2 rounded-full hover:bg-white/10 transition-colors"><HeartIcon className={`w-5 h-5 transition-transform active:scale-125 ${isFavoriteSong(song.id) ? 'fill-[#fc4b08] text-[#fc4b08] drop-shadow-[0_0_5px_rgba(252,75,8,0.5)]' : ''}`} /></button>
                {playlistId && (<button onClick={(e) => { e.stopPropagation(); handleMenuAction(() => removeSongFromPlaylist(playlistId, song.id)); }} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-white/10 transition-colors"><TrashIcon className="w-5 h-5" /></button>)}
                
                <button ref={triggerRef} onClick={(e) => { e.stopPropagation(); setActiveMenu(prev => !prev); }} className={`p-2 rounded-full hover:bg-white/10 transition-colors ${activeMenu ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white'}`}><MoreIcon className="w-5 h-5" /></button>
                
                <SmartMenu isOpen={activeMenu} onClose={() => setActiveMenu(false)} triggerRef={triggerRef}>
                    <div className="flex flex-col py-1">
                        <button onClick={(e) => { e.stopPropagation(); handleMenuAction(() => playRadio(song)) }} className="flex items-center gap-2 text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 text-white transition-colors">
                            <RadioIcon className="w-4 h-4" /> {t('songlist.menu.goToRadio')}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleMenuAction(() => addSongNext(song)) }} className="text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 text-white transition-colors">{t('songlist.menu.playNext')}</button>
                        <button onClick={(e) => { e.stopPropagation(); handleMenuAction(() => addSongsToEnd([song])) }} className="text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 text-white transition-colors">{t('songlist.menu.addToQueue')}</button>
                        <hr className="border-t border-white/10 my-1"/>
                        <p className="px-3 py-1.5 text-xs text-gray-400 font-bold uppercase tracking-wider">{t('player.addToPlaylist')}</p>
                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                            <button onClick={(e) => { e.stopPropagation(); handleMenuAction(() => handleCreateNewPlaylist(song)) }} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 text-white transition-colors">{t('player.newPlaylist')}</button>
                            {playlists.map(p => (<button key={p.id} onClick={(e) => { e.stopPropagation(); handleMenuAction(() => addSongToPlaylist(p.id, song)) }} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-white/10 truncate text-white transition-colors">{p.name}</button>))}
                        </div>
                    </div>
                </SmartMenu>

                <p className="text-sm text-gray-400 w-12 text-right hidden sm:block font-variant-numeric tabular-nums">{formatDuration(song.duration)}</p>
            </div>
        </div>
    );
});

interface SongListProps {
  songs: Song[];
  playlistId?: string;
  context: { type: PlayerContextTypeString; id: string; };
  navigateToArtist: (artistId: string) => void;
  onInteraction?: () => void;
  navigateToPlaylist?: (playlistId: string) => void;
}

export const SongList: React.FC<SongListProps> = (props) => {
  const { songs, ...restProps } = props;
  const { t } = useTranslation();

  if (!songs || songs.length === 0) {
    return <p className="text-gray-400 p-8 text-center">{t('songlist.noSongs')}</p>;
  }

  return (
    <div className="space-y-1">
      {songs.map((song, index) => (
        <SongListItem
          key={song.id + index}
          song={song}
          index={index}
          songs={songs}
          {...restProps}
        />
      ))}
    </div>
  );
};
