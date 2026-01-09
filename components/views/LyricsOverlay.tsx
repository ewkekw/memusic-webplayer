
import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { PlayerContext } from '../../context/PlayerContext';
import { UserMusicContext } from '../../context/UserMusicContext';
import { getLyrics } from '../../services/jioSaavnApi';
import { getSyncedLyrics } from '../../services/lrcApi';
import { Loader } from '../ui/Loader';
import { Song } from '../../types';

const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);
const MaximizeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
);
const MinimizeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h6v6" /><path d="M20 10h-6V4" /><path d="M14 10l7-7" /><path d="M3 21l7-7" /></svg>
);
const VinylIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><path d="M12 12h.01" /></svg>
);
const HeartIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
);
const HeadphonesIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm13 0h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-5Z" />
        <path d="M21 14v-3a9 9 0 0 0-18 0v3" />
        <path d="M12 12v.01" />
    </svg>
);
const WaveformIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 10v4" />
        <path d="M8 8v8" />
        <path d="M12 3v18" />
        <path d="M16 8v8" />
        <path d="M20 10v4" />
    </svg>
);
const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z" /></svg>
);
const PauseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="2" /><rect x="14" y="4" width="4" height="16" rx="2" /></svg>
);
const SkipBackIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 20L9 12l10-8v16zM5 19h2V5H5v14z" /></svg>
);
const SkipForwardIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 4l10 8-10 8V4zM19 5h-2v14h2V5z" /></svg>
);
const ShuffleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg>
);
const RepeatIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
);

interface LrcLine {
    time: number;
    text: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  initialRadius: number;
  radius: number;
  life: number;
  maxLife: number;
}

interface Star {
  x: number;
  y: number;
  z: number;
}


const AmbientBackground = React.memo(({ imageUrl }: { imageUrl: string }) => {
    return (
        <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden bg-[#050505] transition-colors duration-1000">
            <div 
                className="absolute inset-[-20%] w-[140%] h-[140%] bg-cover bg-center animate-[deep-breathe_25s_infinite_alternate_ease-in-out] opacity-60 blur-[100px] brightness-50 saturate-150"
                style={{ backgroundImage: `url(${imageUrl})` }}
            />
            
            <div className="absolute inset-0 opacity-50 mix-blend-screen filter blur-[80px]">
                 <div 
                    className="absolute top-[-10%] left-[-10%] w-[80vw] h-[80vw] rounded-full animate-[orb-drift_25s_infinite_alternate_ease-in-out]"
                    style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)' }}
                 />
                 <div 
                    className="absolute bottom-[-10%] right-[-10%] w-[90vw] h-[90vw] rounded-full animate-[orb-drift_30s_infinite_alternate_ease-in-out_reverse]"
                    style={{ background: 'radial-gradient(circle, rgba(252, 75, 8, 0.4) 0%, transparent 70%)' }}
                 />
            </div>

            <div 
                className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            /> 

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,#050505_130%)] opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent" />
        </div>
    );
});

const HeaderControls = React.memo(({ 
    isFullscreen, 
    onToggleFullscreen, 
    onClose,
    visible
}: { 
    isFullscreen: boolean; 
    onToggleFullscreen: () => void; 
    onClose: () => void;
    visible: boolean;
}) => (
    <div className={`flex items-center gap-2 md:gap-3 z-[100] absolute top-4 right-4 md:top-6 md:right-6 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button 
            onClick={onToggleFullscreen}
            className={`p-2.5 md:p-3 rounded-full transition-all backdrop-blur-md border shadow-lg group hover:scale-105 active:scale-95 ${isFullscreen ? 'bg-black/20 hover:bg-black/40 text-white border-white/10' : 'bg-black/40 hover:bg-black/60 text-gray-200 hover:text-white border-white/10'}`}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
            {isFullscreen ? <MinimizeIcon className="w-4 h-4 md:w-5 md:h-5" /> : <MaximizeIcon className="w-4 h-4 md:w-5 md:h-5" />}
        </button>
        <button 
            onClick={onClose}
            className={`p-2.5 md:p-3 rounded-full transition-all backdrop-blur-md border shadow-lg group hover:scale-105 active:scale-95 ${isFullscreen ? 'bg-black/20 hover:bg-black/40 text-white border-white/10' : 'bg-black/40 hover:bg-black/60 text-gray-200 hover:text-white border-white/10'}`}
            title="Close Lyrics"
        >
            <CloseIcon className="w-4 h-4 md:w-5 md:h-5" />
        </button>
    </div>
));

const ReactiveSettingsMenu = ({ 
    is8D, 
    toggle8D, 
    isReverb, 
    reverbMix,
    setReverbMix,
    toggleReverb,
    visible
}: { 
    is8D: boolean; 
    toggle8D: () => void; 
    isReverb: boolean; 
    reverbMix: number;
    setReverbMix: (val: number) => void;
    toggleReverb: () => void;
    visible: boolean;
}) => {
    const { analyser, isPlaying } = useContext(PlayerContext);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);

    const particles = useRef<Particle[]>([]);
    const stars = useRef<Star[]>([]);
    const smoothedBass = useRef(0);
    const smoothedMids = useRef(0);
    const smoothedTreble = useRef(0);
    const bassHistory = useRef<number[]>([]);
    const lastKickTime = useRef(0);
    const emissionCounter = useRef(0);

    const handleReverbClick = () => {
        if (!isReverb) {
            setReverbMix(0.3);
            toggleReverb();
        } else {
            if (reverbMix <= 0.35) {
                setReverbMix(0.6);
            } else if (reverbMix <= 0.65) {
                setReverbMix(0.9);
            } else {
                toggleReverb();
            }
        }
    };

    useEffect(() => {
        const width = 50; 
        const height = 50;
        const starCount = 100;
        stars.current = [];
        for (let i = 0; i < starCount; i++) {
            stars.current.push({
                x: (Math.random() - 0.5) * width * 1.5,
                y: (Math.random() - 0.5) * height * 1.5,
                z: Math.random() * width,
            });
        }
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        canvas.width = 50;
        canvas.height = 50;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyser ? analyser.frequencyBinCount : 0;
        const dataArray = new Uint8Array(bufferLength);

        const animate = () => {
            animationFrameId.current = requestAnimationFrame(animate);
            if (canvas.width === 0 || canvas.height === 0) return;
            
            if (analyser) analyser.getByteFrequencyData(dataArray);
            
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const bass = dataArray.slice(0, Math.floor(bufferLength * 0.05)).reduce((a, b) => a + b, 0) / (Math.floor(bufferLength * 0.05)) || 0;
            const mids = dataArray.slice(Math.floor(bufferLength * 0.2), Math.floor(bufferLength * 0.5)).reduce((a, b) => a + b, 0) / (Math.floor(bufferLength * 0.3)) || 0;
            const treble = dataArray.slice(Math.floor(bufferLength * 0.5), bufferLength).reduce((a, b) => a + b, 0) / (bufferLength - Math.floor(bufferLength * 0.5)) || 0;

            const smoothingFactor = 0.1;
            smoothedBass.current += (bass - smoothedBass.current) * smoothingFactor;
            smoothedMids.current += (mids - smoothedMids.current) * smoothingFactor;
            smoothedTreble.current += (treble - smoothedTreble.current) * smoothingFactor;
            
            stars.current.forEach(star => {
                star.z -= 0.2;
                if (star.z <= 0) {
                    star.x = (Math.random() - 0.5) * canvas.width * 1.5;
                    star.y = (Math.random() - 0.5) * canvas.height * 1.5;
                    star.z = canvas.width;
                }
                const k = 128 / star.z;
                const px = star.x * k + centerX;
                const py = star.y * k + centerY;
                if (px > 0 && px < canvas.width && py > 0 && py < canvas.height) {
                    const size = (1 - star.z / canvas.width) * 2;
                    const alpha = (1 - star.z / canvas.width) * (0.3 + (smoothedTreble.current / 255) * 0.7);
                    ctx.fillStyle = `rgba(252, 75, 8, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(px, py, Math.max(0, size), 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            
            const baseRadius = (canvas.width / 7) + (smoothedBass.current / 255) * (canvas.width / 10);
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 1.2);
            const brightCenter = `hsl(25, 97%, ${55 + (smoothedTreble.current / 255) * 15}%)`; 
            gradient.addColorStop(0, brightCenter);
            gradient.addColorStop(0.6, '#fc4b08');
            gradient.addColorStop(1, `hsl(25, 100%, ${30 + (smoothedBass.current/255) * 10}%)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            const points = 128;
            for (let i = 0; i <= points; i++) {
                const angle = (i / points) * Math.PI * 2;
                const midOffset = Math.sin(angle * 8 + Date.now() * 0.005) * (smoothedMids.current / 255) * (canvas.width / 25);
                const trebleIndex = Math.floor((i / points) * (bufferLength * 0.5)) + Math.floor(bufferLength * 0.5);
                const spike = (dataArray[trebleIndex] / 255) * (canvas.width / 8) * (smoothedTreble.current / 255);
                const radius = baseRadius + midOffset + spike;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            
            const emitParticle = (speedMultiplier = 1) => {
                const angle = Math.random() * Math.PI * 2;
                const speed = (0.2 + Math.random() * 0.5) * speedMultiplier;
                const startRadius = baseRadius * (0.8 + Math.random() * 0.2);
                const life = 80 + Math.random() * 40;
                const radius = 1 + Math.random() * 2;
                particles.current.push({
                    x: centerX + Math.cos(angle) * startRadius,
                    y: centerY + Math.sin(angle) * startRadius,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    initialRadius: radius,
                    radius: radius,
                    life: life,
                    maxLife: life,
                });
            };

            const continuousEmissionRate = (smoothedBass.current / 255) * 1.5;
            emissionCounter.current += continuousEmissionRate;
            while (emissionCounter.current > 1) {
                emitParticle(0.5);
                emissionCounter.current -= 1;
            }
            
            bassHistory.current.push(bass);
            if (bassHistory.current.length > 30) bassHistory.current.shift();
            const avgBass = bassHistory.current.reduce((a, b) => a + b, 0) / bassHistory.current.length;
            const kickThreshold = 1.25;
            const cooldown = 120;
            const now = Date.now();
            
            if (bass > avgBass * kickThreshold && now - lastKickTime.current > cooldown) {
                lastKickTime.current = now;
                const kickStrength = Math.min(2.5, (bass - avgBass) / 40);
                const particleCount = Math.floor(1 + kickStrength * 1.5);
                for (let i = 0; i < particleCount; i++) {
                    emitParticle(1 + kickStrength * 0.5);
                }
            }
            
            particles.current = particles.current.filter(p => p.life > 0 && p.radius > 0.1);
            particles.current.forEach(p => {
                p.life--;
                const dx = centerX - p.x;
                const dy = centerY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const gravity = 0.18;
                p.vx += (dx / dist) * gravity;
                p.vy += (dy / dist) * gravity;
                p.vx *= 0.94;
                p.vy *= 0.94;
                p.x += p.vx;
                p.y += p.vy;
                p.radius = p.initialRadius * (p.life / p.maxLife);
                if (dist < baseRadius * 1.1) p.radius *= 0.92;
                ctx.fillStyle = '#fc4b08';
                ctx.beginPath();
                ctx.arc(p.x, p.y, Math.max(0, p.radius), 0, Math.PI * 2);
                ctx.fill();
            });
        };

        if (isPlaying) {
            animate();
        } else {
             if (animationFrameId.current) {
                 cancelAnimationFrame(animationFrameId.current);
                 animationFrameId.current = null;
             }
             ctx.clearRect(0, 0, canvas.width, canvas.height);
             particles.current = [];
             bassHistory.current = [];
             smoothedBass.current = 0;
             smoothedMids.current = 0;
             smoothedTreble.current = 0;
             emissionCounter.current = 0;
        }

        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [analyser, isPlaying]);

    return (
        <div className={`fixed top-6 left-6 z-50 group flex flex-col gap-2 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="relative bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-hidden w-10 h-10 md:w-12 md:h-12 group-hover:h-[9.5rem] shadow-2xl flex flex-col items-center">
                <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shrink-0 z-20 cursor-pointer relative">
                    <div className={`absolute w-3 h-3 bg-[#fc4b08] rounded-full shadow-[0_0_10px_#fc4b08] transition-all duration-700 ease-in-out ${isPlaying ? 'opacity-0 scale-150 blur-md' : 'opacity-100 scale-100 blur-0'}`} />
                    <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full transition-all duration-700 ease-in-out ${isPlaying ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
                </div>
                <div className="flex flex-col gap-3 items-center w-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 pt-1 pb-4 z-10">
                    <button onClick={toggle8D} title="8D Audio" className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border ${is8D ? 'bg-[#fc4b08] border-[#fc4b08] text-white shadow-[0_0_15px_rgba(252,75,8,0.6)]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/30'}`}>
                        <HeadphonesIcon className="w-5 h-5 fill-none" />
                    </button>
                    <button onClick={handleReverbClick} title="Reverb" className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border ${isReverb ? 'bg-[#fc4b08] border-[#fc4b08] text-white shadow-[0_0_15px_rgba(252,75,8,0.6)]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/30'}`}>
                        <WaveformIcon className="w-5 h-5 fill-none" />
                        {/* Level Indicator for Reverb */}
                        {isReverb && (
                            <span className="absolute -right-1 -bottom-1 flex gap-0.5">
                                <span className={`w-1 h-1 rounded-full bg-white ${reverbMix >= 0.2 ? 'opacity-100' : 'opacity-30'}`} />
                                <span className={`w-1 h-1 rounded-full bg-white ${reverbMix >= 0.5 ? 'opacity-100' : 'opacity-30'}`} />
                                <span className={`w-1 h-1 rounded-full bg-white ${reverbMix >= 0.8 ? 'opacity-100' : 'opacity-30'}`} />
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

const SongInfoLeft: React.FC<{
    currentSong: Song | null;
    isPlaying: boolean;
    togglePlay: () => void;
    playPrev: () => void;
    playNext: () => void;
    isFavorite: boolean;
    onToggleFavorite: () => void;
    currentTime: number;
    duration: number;
    seek: (time: number) => void;
    isShuffle: boolean;
    toggleShuffle: () => void;
    repeatMode: 'off' | 'all' | 'one';
    cycleRepeatMode: () => void;
}> = ({
    currentSong, isPlaying, togglePlay, playPrev, playNext, isFavorite, onToggleFavorite,
    currentTime, duration, seek, isShuffle, toggleShuffle, repeatMode, cycleRepeatMode
}) => {
    const progressBarRef = useRef<HTMLDivElement>(null);

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressBarRef.current || duration <= 0) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        seek(percent * duration);
    };

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (!currentSong) return null;

    const imageUrl = currentSong.image?.find(img => img.quality === '500x500')?.url || currentSong.image?.[0]?.url;
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="flex flex-col gap-8 w-full max-w-md animate-in fade-in slide-in-from-left-8 duration-700 mx-auto">
            <div className="aspect-square w-full relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                <img src={imageUrl} alt={currentSong.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
            </div>

            <div className="space-y-1">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="text-3xl font-black text-white leading-tight line-clamp-2" title={currentSong.name}>
                            {currentSong.name}
                        </h2>
                        <p className="text-lg text-gray-400 font-medium truncate mt-1">
                            {currentSong.artists.primary.map(a => a.name).join(', ')}
                        </p>
                    </div>
                    <button 
                        onClick={onToggleFavorite} 
                        className={`p-3 rounded-full transition-colors ${isFavorite ? 'text-[#fc4b08] bg-[#fc4b08]/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                    >
                        {isFavorite ? <HeartIcon className="w-7 h-7 fill-current" /> : <HeartIcon className="w-7 h-7" />}
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <div 
                    className="group/bar relative h-1.5 w-full bg-white/10 rounded-full cursor-pointer touch-none hover:h-2 transition-all"
                    onClick={handleSeek}
                    ref={progressBarRef}
                >
                    <div 
                        className="absolute h-full bg-[#fc4b08] rounded-full group-hover/bar:bg-[#ff5f22] transition-all shadow-[0_0_10px_#fc4b08]" 
                        style={{ width: `${progressPercent}%` }}
                    />
                    <div className="absolute -top-3 -bottom-3 w-full" />
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-500 font-mono tracking-widest">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <button 
                    onClick={toggleShuffle}
                    className={`p-2 transition-colors ${isShuffle ? 'text-[#fc4b08]' : 'text-gray-500 hover:text-white'}`}
                >
                    <ShuffleIcon className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-6">
                    <button onClick={playPrev} className="text-gray-300 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                        <SkipBackIcon className="w-8 h-8" />
                    </button>
                    <button 
                        onClick={togglePlay} 
                        className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
                    >
                        {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8 ml-1" />}
                    </button>
                    <button onClick={playNext} className="text-gray-300 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                        <SkipForwardIcon className="w-8 h-8" />
                    </button>
                </div>

                <button 
                    onClick={cycleRepeatMode}
                    className={`p-2 transition-colors relative ${repeatMode !== 'off' ? 'text-[#fc4b08]' : 'text-gray-500 hover:text-white'}`}
                >
                    <RepeatIcon className="w-5 h-5" />
                    {repeatMode === 'one' && <span className="absolute top-0 right-0 text-[8px] font-bold bg-[#fc4b08] text-black px-0.5 rounded">1</span>}
                </button>
            </div>
        </div>
    );
};

const MemoizedLyricsList: React.FC<{
    lines: LrcLine[];
    activeLineIndex: number;
    seek: (time: number) => void;
    isFullscreen: boolean;
}> = React.memo(({ lines, activeLineIndex, seek, isFullscreen }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeLineIndex !== -1 && containerRef.current) {
            const activeEl = containerRef.current.children[activeLineIndex] as HTMLElement;
            if (activeEl) {
                const container = containerRef.current;
                const scrollOffset = activeEl.offsetTop - (container.clientHeight / 2) + (activeEl.clientHeight / 2);
                
                container.scrollTo({
                    top: scrollOffset,
                    behavior: 'smooth'
                });
            }
        }
    }, [activeLineIndex]);

    return (
        <div 
            ref={containerRef}
            className={`h-full overflow-y-auto custom-scrollbar-hidden px-4 md:px-20 py-[50vh] space-y-8 text-center w-full ${isFullscreen ? '' : 'mask-gradient-y'}`}
        >
            {lines.map((line, index) => {
                const isActive = index === activeLineIndex;
                const isNear = Math.abs(index - activeLineIndex) <= 1;
                
                return (
                    <div
                        key={index}
                        onClick={() => seek(line.time)}
                        className={`
                            cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
                            py-4 px-6 rounded-2xl origin-center will-change-[transform,opacity,filter]
                            text-3xl md:text-5xl font-bold leading-tight select-none max-w-5xl mx-auto tracking-tight
                            ${isActive 
                                ? 'opacity-100 scale-110 text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.35)] blur-0' 
                                : isNear 
                                    ? 'opacity-50 scale-100 text-gray-300 blur-[0.5px] hover:opacity-80 hover:blur-0'
                                    : 'opacity-20 scale-95 text-gray-500 blur-[2px] hover:opacity-60 hover:blur-0'
                            }
                        `}
                    >
                        {line.text}
                    </div>
                );
            })}
        </div>
    );
});

const PlainLyricsView: React.FC<{
    lines: string[];
    isFullscreen: boolean;
}> = ({ lines, isFullscreen }) => (
    <div className="h-full overflow-y-auto custom-scrollbar px-6 md:px-12 py-20 text-center">
        <div className="space-y-6 max-w-2xl mx-auto">
            {lines.map((line, idx) => (
                <p key={idx} className="text-xl md:text-2xl text-gray-300 font-medium leading-relaxed hover:text-white transition-colors">
                    {line}
                </p>
            ))}
        </div>
        <p className="mt-12 text-sm text-gray-600 font-bold uppercase tracking-widest">Lyrics not synced</p>
    </div>
);


export const LyricsOverlay: React.FC = () => {
    const { 
        currentSong, isLyricsOpen, toggleLyrics, currentTime, duration, seek, 
        isPlaying, togglePlay, playNext, playPrev, 
        is8DEnabled, toggle8D, isReverbEnabled, toggleReverb, reverbMix, setReverbMix,
        isShuffle, toggleShuffle, repeatMode, cycleRepeatMode
    } = useContext(PlayerContext);
    const { isFavoriteSong, toggleFavoriteSong } = useContext(UserMusicContext);
    const [syncedLyrics, setSyncedLyrics] = useState<LrcLine[] | null>(null);
    const [plainLyrics, setPlainLyrics] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeLineIndex, setActiveLineIndex] = useState<number>(-1);
    const [viewMode, setViewMode] = useState<'embedded' | 'fullscreen' | 'art'>('embedded');
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef<number | null>(null);
    
    const handleUserActivity = useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        
        if (viewMode === 'fullscreen' || viewMode === 'art') {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    }, [viewMode]);

    useEffect(() => {
        if (viewMode === 'fullscreen' || viewMode === 'art') {
            window.addEventListener('mousemove', handleUserActivity);
            window.addEventListener('touchstart', handleUserActivity);
            window.addEventListener('click', handleUserActivity);
            handleUserActivity();
            
            return () => {
                window.removeEventListener('mousemove', handleUserActivity);
                window.removeEventListener('touchstart', handleUserActivity);
                window.removeEventListener('click', handleUserActivity);
                if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            };
        } else {
            setShowControls(true);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        }
    }, [viewMode, handleUserActivity]);

    useEffect(() => {
        if (!isLyricsOpen) return;
        setSyncedLyrics(null);
        setPlainLyrics([]);
        setError(null);
        setActiveLineIndex(-1);
    }, [currentSong?.id, isLyricsOpen]);

    useEffect(() => {
        const fetchLyrics = async () => {
            if (!currentSong) return;
            setLoading(true);
            setError(null);
            try {
                const lrcData = await getSyncedLyrics(
                    currentSong.name,
                    currentSong.artists.primary[0]?.name || '',
                    currentSong.album.name || '',
                    currentSong.duration || 0
                );
                if (lrcData && lrcData.syncedLyrics) {
                    const lines = parseLrc(lrcData.syncedLyrics);
                    setSyncedLyrics(lines);
                    setLoading(false);
                    return; 
                }
            } catch (e) {}

            if (currentSong.hasLyrics) {
                try {
                    const response = await getLyrics(currentSong.id);
                    if (response.success && response.data.lyrics) {
                        const rawHtml = response.data.lyrics;
                        const lines = rawHtml.split(/<br\s*\/?>/i).map(line => line.trim()).filter(line => line.length > 0);
                        setPlainLyrics(lines);
                        setLoading(false);
                        return;
                    }
                } catch (err) {}
            }
            setError("Lyrics Unavailable");
            setLoading(false);
        };

        if (isLyricsOpen && !syncedLyrics && plainLyrics.length === 0 && !error) {
            fetchLyrics();
        }
    }, [currentSong, isLyricsOpen, syncedLyrics, plainLyrics.length, error]);

    const parseLrc = (lrc: string): LrcLine[] => {
        const lines: LrcLine[] = [];
        const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
        lrc.split('\n').forEach(line => {
            const match = line.match(regex);
            if (match) {
                const minutes = parseInt(match[1], 10);
                const seconds = parseInt(match[2], 10);
                const milliseconds = parseInt(match[3], 10);
                const text = match[4].trim();
                const time = minutes * 60 + seconds + (milliseconds / (match[3].length === 3 ? 1000 : 100));
                if (text) lines.push({ time, text });
            }
        });
        return lines;
    };

    useEffect(() => {
        if (!syncedLyrics || syncedLyrics.length === 0) return;
        const SYNC_OFFSET = 0.2; 
        let activeIndex = -1;
        for (let i = 0; i < syncedLyrics.length; i++) {
            if (syncedLyrics[i].time <= currentTime + SYNC_OFFSET) {
                activeIndex = i;
            } else {
                break;
            }
        }
        if (activeIndex !== activeLineIndex) {
            setActiveLineIndex(activeIndex);
        }
    }, [currentTime, syncedLyrics, activeLineIndex]);

    const toggleFavorite = useCallback(() => {
        if (currentSong) toggleFavoriteSong(currentSong);
    }, [currentSong, toggleFavoriteSong]);

    if (!isLyricsOpen) return null;

    const highQualityImage = currentSong?.image?.find(img => img.quality === '500x500')?.url || currentSong?.image?.[0]?.url || '';
    const isFullscreen = viewMode === 'fullscreen' || viewMode === 'art';
    const isFav = currentSong ? isFavoriteSong(currentSong.id) : false;

    const containerStyle = isFullscreen 
        ? "fixed inset-0 z-[200] bg-[#050505]" 
        : "absolute inset-0 z-20 bg-[#050505]"; 

    return (
        <div className={`${containerStyle} flex flex-col transition-all duration-500 overflow-hidden`}>
            
            <AmbientBackground imageUrl={highQualityImage} />
            
            {isFullscreen && (
                <ReactiveSettingsMenu 
                    is8D={is8DEnabled} 
                    toggle8D={toggle8D} 
                    isReverb={isReverbEnabled} 
                    reverbMix={reverbMix}
                    setReverbMix={setReverbMix}
                    toggleReverb={toggleReverb} 
                    visible={showControls}
                />
            )}

            <HeaderControls 
                isFullscreen={isFullscreen} 
                onToggleFullscreen={() => setViewMode(prev => prev === 'embedded' ? 'fullscreen' : 'embedded')} 
                onClose={() => toggleLyrics(false)}
                visible={viewMode === 'embedded' || showControls}
            />

            <div className={`relative z-10 flex w-full h-full ${isFullscreen ? 'flex-col lg:flex-row' : 'flex-col'}`}>
                
                {isFullscreen && (
                    <div className={`
                        transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] 
                        flex-col justify-center items-center
                        ${viewMode === 'art' ? 'w-full scale-110 flex items-center' : 'hidden lg:flex w-[45%] lg:w-[45%] xl:w-[40%] p-8 border-r border-white/5 bg-black/20'}
                        max-h-full min-h-0
                    `}>
                        <SongInfoLeft 
                            currentSong={currentSong}
                            isPlaying={isPlaying}
                            togglePlay={togglePlay}
                            playPrev={playPrev}
                            playNext={playNext}
                            isFavorite={isFav}
                            onToggleFavorite={toggleFavorite}
                            currentTime={currentTime}
                            duration={duration}
                            seek={seek}
                            isShuffle={isShuffle}
                            toggleShuffle={toggleShuffle}
                            repeatMode={repeatMode}
                            cycleRepeatMode={cycleRepeatMode}
                        />
                    </div>
                )}

                <div className={`relative flex-1 flex flex-col min-h-0 ${isFullscreen ? (viewMode === 'art' ? 'hidden' : 'lg:w-[55%] xl:w-[60%] w-full') : 'w-full'}`}>
                    
                    {isFullscreen && !viewMode && (
                        <div className={`flex-shrink-0 text-center px-6 transition-all duration-500 lg:hidden pt-20 pb-4`}>
                            <div className="w-32 h-32 mx-auto mb-4 rounded-xl overflow-hidden shadow-2xl border border-white/10 relative group">
                                <img src={highQualityImage} alt="Cover" className="w-full h-full object-cover" />
                            </div>
                            <h2 className="text-white font-black text-2xl truncate tracking-tight">{currentSong?.name}</h2>
                            <p className="text-white/60 text-lg font-bold">{currentSong?.artists.primary[0]?.name}</p>
                        </div>
                    )}

                    <div className="flex-1 relative min-h-0">
                        {loading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 animate-pulse">
                                <Loader />
                                <p className="text-white/40 text-sm font-bold tracking-[0.2em] uppercase">Syncing Lyrics</p>
                            </div>
                        ) : error ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 opacity-0 animate-in zoom-in-95 fade-in duration-500 fill-mode-forwards p-8 text-center">
                                <div className="w-32 h-32 rounded-full border-2 border-white/5 flex items-center justify-center bg-white/5 shadow-2xl animate-[spin_12s_linear_infinite]">
                                    <VinylIcon className="w-16 h-16 text-white/20" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Instrumental</h3>
                                    <p className="text-lg text-white/40 font-medium">Enjoy the vibe.</p>
                                </div>
                            </div>
                        ) : syncedLyrics ? (
                            <MemoizedLyricsList 
                                lines={syncedLyrics} 
                                activeLineIndex={activeLineIndex} 
                                seek={seek} 
                                isFullscreen={isFullscreen} 
                            />
                        ) : (
                            <PlainLyricsView lines={plainLyrics} isFullscreen={isFullscreen} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
