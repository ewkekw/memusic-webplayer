
import React, { useContext, useMemo, useState, useRef, useEffect } from 'react';
import { PlayerContext } from '../../context/PlayerContext';
import { UserMusicContext } from '../../context/UserMusicContext';

const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.648c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
  </svg>
);

const PauseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75zm9 0a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>
);

const NextIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path d="M4 4a1 1 0 00-1 1v10a1 1 0 001 1h1.5a1 1 0 001-1V5a1 1 0 00-1-1H4z" />
        <path d="M7.5 4a1 1 0 00-1 1v10a1 1 0 001 1h5.236a1 1 0 00.825-.447l3.264-5a1 1 0 000-1.106l-3.264-5A1 1 0 0012.736 4H7.5z" />
    </svg>
);

const PrevIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path d="M16 4a1 1 0 011 1v10a1 1 0 01-1 1h-1.5a1 1 0 01-1-1V5a1 1 0 011-1H16z" />
        <path d="M12.5 4a1 1 0 011 1v10a1 1 0 01-1 1H7.264a1 1 0 01-.825-.447l-3.264-5a1 1 0 010-1.106l3.264-5A1 1 0 017.264 4h5.236z" />
    </svg>
);

const VolumeUpIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
  </svg>
);

const VolumeDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75a4.5 4.5 0 010 4.5m-1.5-4.5a2.25 2.25 0 010 2.25m-1.5-2.25a.75.75 0 010 .75M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
);

const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);
const PlusCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const HeartIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
);
const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

const QueueIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
    </svg>
);

const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

interface PlayerProps {
    navigateToArtist: (artistId: string) => void;
}

export const Player: React.FC<PlayerProps> = ({ navigateToArtist }) => {
  const { currentSong, isPlaying, duration, currentTime, volume, togglePlay, seek, setVolume, playNext, playPrev, selectedQuality, setSelectedQuality, currentQuality, isQueueOpen, toggleQueue, isShuffle, repeatMode, toggleShuffle, cycleRepeatMode } = useContext(PlayerContext);
  const { isFavoriteSong, toggleFavoriteSong, playlists, addSongToPlaylist } = useContext(UserMusicContext);
  
  const [isBitrateModalOpen, setIsBitrateModalOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const bitrateButtonRef = useRef<HTMLDivElement>(null);
  const playlistButtonRef = useRef<HTMLDivElement>(null);

  const progress = useMemo(() => (duration > 0 ? (currentTime / duration) * 100 : 0), [currentTime, duration]);

  const decodeHtml = (html: string | null) => {
    if (!html) return '';
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (bitrateButtonRef.current && !bitrateButtonRef.current.contains(event.target as Node)) {
            setIsBitrateModalOpen(false);
        }
        if (playlistButtonRef.current && !playlistButtonRef.current.contains(event.target as Node)) {
            setIsPlaylistModalOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownload = async () => {
      if (!currentSong) return;
      const songUrl = currentSong.downloadUrl.find(q => q.quality === currentQuality)?.url;
      if (!songUrl) {
          alert("Could not find a download link for the current quality.");
          return;
      }

      try {
          const response = await fetch(songUrl);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          const fileExtension = currentSong.name.endsWith('.mp3') ? '' : '.mp3';
          a.download = `${currentSong.name} - ${currentSong.artists.primary.map(a => a.name).join(', ')}${fileExtension}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
      } catch (error) {
          console.error('Download failed:', error);
          alert('Failed to download song. There might be a network issue or CORS restrictions.');
      }
  };

  const handleAddSongToPlaylist = (playlistId: string) => {
    if (currentSong) {
        addSongToPlaylist(playlistId, currentSong);
        setIsPlaylistModalOpen(false);
    }
  };


  if (!currentSong) {
    return (
      <div className="h-24 bg-black/30 backdrop-blur-md border-t border-white/10 flex items-center justify-center">
        <p className="text-gray-500">No song selected</p>
      </div>
    );
  }

  const smallImage = currentSong.image?.find(img => img.quality === '50x50')?.url || currentSong.image?.[0]?.url;

  return (
    <div className="h-24 bg-black/40 backdrop-blur-lg border-t border-white/10 p-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4">
      {/* Song Info */}
       <div className="flex items-center space-x-4 min-w-0 overflow-hidden">
        {smallImage && <img src={smallImage} alt={decodeHtml(currentSong.name)} className="w-14 h-14 rounded-md shadow-lg flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white truncate" title={decodeHtml(currentSong.name)}>{decodeHtml(currentSong.name)}</h3>
          <p className="text-sm text-gray-400 truncate">
            {currentSong.artists.primary.map((artist, index) => (
                <React.Fragment key={artist.id}>
                    <span onClick={(e) => { e.stopPropagation(); navigateToArtist(artist.id); }} className="hover:underline cursor-pointer" title={decodeHtml(artist.name)}>
                        {decodeHtml(artist.name)}
                    </span>
                    {index < currentSong.artists.primary.length - 1 && ', '}
                </React.Fragment>
            ))}
          </p>
        </div>
      </div>

      {/* Player Controls */}
      <div className="flex flex-col items-center">
        <div className="flex items-center space-x-2">
            <button onClick={toggleShuffle} title="Shuffle" className={`relative transition-colors w-10 h-10 rounded-full flex items-center justify-center ${isShuffle ? 'text-[#fc4b08]' : 'text-gray-400 hover:text-white'} hover:bg-white/10`}>
                <span className="font-bold text-xl leading-none">S</span>
                {isShuffle && <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#fc4b08] rounded-full"></div>}
            </button>
            <button onClick={playPrev} className="text-gray-300 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"><PrevIcon className="w-8 h-8" /></button>
            <button
                onClick={togglePlay}
                className="w-14 h-14 bg-[#fc4b08] rounded-full flex items-center justify-center text-black shadow-lg shadow-[#fc4b08]/30 hover:brightness-110 transform hover:scale-105 transition-all duration-200"
            >
                {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8 ml-0.5" />}
            </button>
            <button onClick={playNext} className="text-gray-300 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"><NextIcon className="w-8 h-8" /></button>
            <button onClick={cycleRepeatMode} title={`Repeat: ${repeatMode}`} className={`relative transition-colors w-10 h-10 rounded-full flex items-center justify-center ${repeatMode !== 'off' ? 'text-[#fc4b08]' : 'text-gray-400 hover:text-white'} hover:bg-white/10`}>
                <span className="font-bold text-xl leading-none">R</span>
                {repeatMode !== 'off' && <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#fc4b08] rounded-full"></div>}
                {repeatMode === 'one' && <span className="absolute top-1 right-1 text-[#fc4b08] text-[11px] font-bold leading-none">1</span>}
            </button>
        </div>
        <div className="w-full flex items-center space-x-2 mt-2">
            <span className="text-xs text-gray-400">{formatTime(currentTime)}</span>
            <div className="w-full bg-gray-600/50 rounded-full h-1 group cursor-pointer" onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const width = rect.width;
                seek((clickX / width) * duration);
            }}>
                <div className="bg-[#fc4b08] h-1 rounded-full group-hover:bg-[#ff5f22]" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="text-xs text-gray-400">{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* Volume & Extra Controls */}
      <div className="flex items-center justify-end space-x-2">
        <div className="relative" ref={bitrateButtonRef}>
          <button
            onClick={() => setIsBitrateModalOpen(prev => !prev)}
            className={`flex items-center space-x-1 px-3 py-2 text-sm rounded-md transition-all ${isBitrateModalOpen ? 'bg-white/20 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
          >
            <span className="w-16 text-center">{currentQuality || 'auto'}</span>
            <ChevronDownIcon className="w-4 h-4 flex-shrink-0"/>
          </button>
          {isBitrateModalOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-40 bg-[#282828] border border-white/10 rounded-lg shadow-2xl p-2 z-30">
              <p className="px-2 py-1 text-xs text-gray-400 font-bold uppercase tracking-widest">Quality</p>
              <div className="mt-1 flex flex-col">
                  {currentSong.downloadUrl.map(q => (
                    <button
                      key={q.quality}
                      onClick={() => {
                        setSelectedQuality(q.quality);
                        setIsBitrateModalOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${selectedQuality === q.quality ? 'bg-[#fc4b08] text-white font-bold' : 'text-gray-300 hover:bg-white/10'}`}
                    >
                      {q.quality}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        <button onClick={handleDownload} title="Download song" className="text-gray-300 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"><DownloadIcon className="w-5 h-5"/></button>
        
        <div className="relative" ref={playlistButtonRef}>
            <button onClick={() => setIsPlaylistModalOpen(p => !p)} title="Add to playlist" className="text-gray-300 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"><PlusCircleIcon className="w-5 h-5"/></button>
            {isPlaylistModalOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#282828] border border-white/10 rounded-lg shadow-lg p-2 z-30 max-h-48 overflow-y-auto">
                  <p className="px-3 py-1.5 text-xs text-gray-400 font-bold uppercase">Add to playlist</p>
                  {playlists.length > 0 ? playlists.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleAddSongToPlaylist(p.id)}
                      className="w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-white/10 truncate"
                    >
                      {p.name}
                    </button>
                  )) : <p className="px-3 py-1.5 text-sm text-gray-500">No playlists.</p>}
                </div>
            )}
        </div>

        <button onClick={() => toggleFavoriteSong(currentSong)} title="Favorite song" className="text-gray-300 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10">
          <HeartIcon className={`w-5 h-5 transition-all ${isFavoriteSong(currentSong.id) ? 'fill-[#fc4b08] text-[#fc4b08]' : ''}`}/>
        </button>

        <button onClick={toggleQueue} title="Show queue" className={`transition-colors p-2 rounded-full ${isQueueOpen ? 'text-[#fc4b08] bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}>
            <QueueIcon className="w-5 h-5"/>
        </button>

        <div className="flex items-center space-x-2">
            {volume > 0.5 ? <VolumeUpIcon className="w-5 h-5 text-gray-400"/> : <VolumeDownIcon className="w-5 h-5 text-gray-400"/>}
            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="volume-slider"
            />
        </div>
      </div>
    </div>
  );
};