
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../context/LanguageContext';

const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z" /></svg>
);
const PauseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="2" /><rect x="14" y="4" width="4" height="16" rx="2" /></svg>
);
const HeartIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
);
const MoreIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
);
const CameraIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
);
const PencilIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
);
const VerifiedIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
);

interface CinematicHeaderProps {
    title: string;
    type: string;
    subtitle?: React.ReactNode;
    description?: string;
    imageUrl?: string;
    isVerified?: boolean;
    meta?: string;
    isPlaying: boolean;
    isCurrentContext: boolean;
    onPlay: () => void;
    onToggleFavorite: () => void;
    isFavorite: boolean;
    children?: React.ReactNode;
    
    isEditable?: boolean;
    onEditTitle?: () => void;
    onImageUpload?: (file: File) => void;
    
    onMoreOptions?: (e: React.MouseEvent) => void;
}

export const CinematicHeader: React.FC<CinematicHeaderProps> = ({
    title, type, subtitle, description, imageUrl, isVerified, meta,
    isPlaying, isCurrentContext, onPlay, onToggleFavorite, isFavorite, children,
    isEditable, onEditTitle, onImageUpload, onMoreOptions
}) => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const main = document.querySelector('main');
            if (main) {
                setIsScrolled(main.scrollTop > 350);
            }
        };
        const main = document.querySelector('main');
        main?.addEventListener('scroll', handleScroll);
        return () => main?.removeEventListener('scroll', handleScroll);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && onImageUpload) {
            onImageUpload(e.target.files[0]);
        }
    };

    return (
        <div ref={containerRef} className="relative w-full">
            <div className={`fixed top-0 left-0 right-0 z-40 md:pl-64 h-20 bg-[#050505]/90 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-6 transition-all duration-500 transform ${isScrolled ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
                <div className="flex items-center gap-4 overflow-hidden">
                    <button 
                        onClick={onPlay} 
                        className="w-12 h-12 bg-[#fc4b08] rounded-full flex items-center justify-center text-black shadow-[0_0_20px_rgba(252,75,8,0.4)] hover:scale-105 hover:bg-[#ff5f22] active:scale-95 transition-all duration-300 flex-shrink-0"
                    >
                        {isCurrentContext && isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6 ml-0.5" />}
                    </button>
                    <span className="font-bold text-xl text-white truncate tracking-tight">{title}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onToggleFavorite} className={`p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-all active:scale-95 ${isFavorite ? 'text-[#fc4b08]' : 'text-gray-400'}`}>
                        <HeartIcon className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="relative w-full overflow-hidden group">
                
                <div className="absolute inset-0 z-0 h-[85vh] select-none pointer-events-none overflow-hidden">
                    <div 
                        className="absolute inset-0 bg-cover bg-center opacity-50 blur-[100px] scale-110 transition-all duration-[2s]"
                        style={{ backgroundImage: imageUrl ? `url(${imageUrl})` : undefined, backgroundColor: '#121212' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-[#050505]/40 to-[#050505]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-transparent via-[#050505]/20 to-[#050505]" />
                </div>

                <div className="relative z-10 px-6 md:px-12 pt-24 pb-12 flex flex-col md:flex-row items-end gap-10 min-h-[55vh]">
                    
                    <div 
                        className={`relative group/image flex-shrink-0 rounded-lg ${isEditable ? 'cursor-pointer' : ''}`}
                        onClick={() => isEditable && fileInputRef.current?.click()}
                    >
                        <div 
                            className="absolute inset-4 blur-2xl opacity-60 rounded-full"
                            style={{ backgroundImage: imageUrl ? `url(${imageUrl})` : undefined, backgroundSize: 'cover' }}
                        ></div>

                        <div className="w-52 h-52 md:w-72 md:h-72 relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 shadow-2xl ring-1 ring-white/5 z-10 transform transition-transform duration-500 group-hover/image:scale-[1.02]">
                            {imageUrl ? (
                                <img src={imageUrl} alt={title} className="w-full h-full object-cover shadow-inner animate-image-appear" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-black">
                                    <span className="text-5xl">🎵</span>
                                </div>
                            )}
                            
                            {isEditable && (
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
                                    <CameraIcon className="w-12 h-12 text-white mb-3" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-white">Change Image</span>
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col gap-4 pb-2">
                        <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/5 backdrop-blur-md text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-white shadow-sm">
                                {isVerified && <VerifiedIcon className="w-3.5 h-3.5 text-blue-400 -ml-0.5" />}
                                {type}
                            </span>
                        </div>
                        
                        <div className="group/title relative">
                            <h1 
                                className={`text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-[0.9] drop-shadow-2xl mix-blend-overlay opacity-90 ${isEditable ? 'cursor-pointer hover:underline decoration-[#fc4b08] decoration-4 underline-offset-8' : ''}`}
                                onClick={() => isEditable && onEditTitle?.()}
                            >
                                {title}
                                {isEditable && <PencilIcon className="w-8 h-8 inline-block ml-4 text-gray-500 opacity-0 group-hover/title:opacity-100 transition-opacity" />}
                            </h1>
                        </div>

                        {description && (
                            <p 
                                className={`text-lg text-gray-300 font-medium max-w-3xl line-clamp-2 mt-2 drop-shadow-md leading-relaxed ${isEditable ? 'cursor-pointer hover:text-white transition-colors' : ''}`}
                                onClick={() => isEditable && onEditTitle?.()}
                            >
                                {description}
                            </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-gray-300 mt-4 tracking-wide">
                            {subtitle && <span className="text-white border-r border-white/20 pr-4">{subtitle}</span>}
                            {meta && <span>{meta}</span>}
                        </div>
                    </div>
                </div>

                <div className="relative z-10 px-6 md:px-12 pb-6">
                    <div className="inline-flex items-center p-2 pr-6 rounded-[2rem] bg-white/5 border border-white/5 backdrop-blur-xl shadow-xl hover:bg-white/10 transition-colors duration-300 gap-4">
                        <button 
                            onClick={onPlay} 
                            className="relative w-16 h-16 bg-[#fc4b08] text-black rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(252,75,8,0.5)] hover:scale-105 hover:bg-[#ff5f22] active:scale-95 transition-all duration-300 group"
                        >
                            <div className="absolute inset-0 rounded-full border border-white/20"></div>
                            {isCurrentContext && isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8 ml-1" />}
                        </button>

                        <div className="h-8 w-px bg-white/10 mx-2"></div>

                        <div className="flex items-center gap-2">
                            <button 
                                onClick={onToggleFavorite} 
                                className="p-3 rounded-full hover:bg-white/10 transition-all active:scale-90 group/fav"
                                title={isFavorite ? t('albumView.removeFromFav') : t('albumView.addToFav')}
                            >
                                <HeartIcon className={`w-7 h-7 transition-all duration-300 ${isFavorite ? 'fill-[#fc4b08] text-[#fc4b08] drop-shadow-[0_0_10px_rgba(252,75,8,0.5)]' : 'text-gray-300 group-hover/fav:text-white'}`} />
                            </button>

                            {onMoreOptions && (
                                <button 
                                    onClick={onMoreOptions} 
                                    className="p-3 rounded-full hover:bg-white/10 transition-all active:scale-90 text-gray-300 hover:text-white"
                                >
                                    <MoreIcon className="w-7 h-7" />
                                </button>
                            )}

                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
