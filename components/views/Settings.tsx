
import React, { useContext, useRef, useState, useEffect } from 'react';
import { PlayerContext } from '../../context/PlayerContext';
import { UserMusicContext } from '../../context/UserMusicContext';
import { ModalContext } from '../../context/ModalContext';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { ProfileContext } from '../../context/ProfileContext';
import { defaultAvatars } from '../../utils/defaults';
import { useTranslation } from '../../context/LanguageContext';

const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>);
const SpeakerIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>);
const EqualizerIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>);
const DatabaseIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>);
const InfoIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>);
const UploadIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>);
const PencilIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>);
const CameraIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>);
const DiceIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" /></svg>);
const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>);
const ImportIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>);
const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>);

type SettingsTab = 'profile' | 'audio' | 'effects' | 'data' | 'about';

interface SectionProps {
    isActive: boolean;
}

const SettingsHeader: React.FC<{ title: string; description: string; }> = ({ title, description }) => (
    <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-2">{title}</h2>
        <p className="text-gray-400 font-medium">{description}</p>
    </div>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`glass-panel border border-white/5 rounded-3xl p-6 md:p-8 ${className}`}>
        {children}
    </div>
);

const VerticalFader: React.FC<{
    value: number;
    min: number;
    max: number;
    onChange: (val: number) => void;
    label: string;
    disabled?: boolean;
}> = ({ value, min, max, onChange, label, disabled }) => {
    const trackRef = useRef<HTMLDivElement>(null);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (disabled || !trackRef.current) return;
        const track = trackRef.current;
        track.setPointerCapture(e.pointerId);

        const updateValue = (clientY: number) => {
            const rect = track.getBoundingClientRect();
            const height = rect.height;
            const relativeY = rect.bottom - clientY;
            const percentage = Math.max(0, Math.min(1, relativeY / height));
            const range = max - min;
            const newValue = min + (percentage * range);
            onChange(newValue);
        };

        updateValue(e.clientY);

        const onPointerMove = (ev: PointerEvent) => updateValue(ev.clientY);
        const onPointerUp = (ev: PointerEvent) => {
            track.releasePointerCapture(ev.pointerId);
            track.removeEventListener('pointermove', onPointerMove);
            track.removeEventListener('pointerup', onPointerUp);
        };

        track.addEventListener('pointermove', onPointerMove);
        track.addEventListener('pointerup', onPointerUp);
    };

    const percent = ((value - min) / (max - min)) * 100;

    return (
        <div className={`flex flex-col items-center h-full group select-none ${disabled ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
            <div 
                ref={trackRef}
                onPointerDown={handlePointerDown}
                className="relative w-14 h-48 sm:h-56 cursor-pointer touch-none flex justify-center py-4 bg-[#0a0a0a] rounded-lg border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
            >
                <div className="absolute w-1 h-[calc(100%-2rem)] top-4 bg-[#222] rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,1)]">
                    <div 
                        className="absolute bottom-0 left-0 right-0 bg-[#fc4b08] w-full rounded-b-full opacity-40"
                        style={{ height: `${percent}%` }}
                    />
                </div>

                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/20 pointer-events-none" />

                <div 
                    className="absolute left-1/2 -translate-x-1/2 w-10 h-6 bg-gradient-to-b from-[#444] to-[#222] rounded-sm shadow-[0_4px_6px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.1)] flex items-center justify-center z-10 pointer-events-none transition-transform duration-100 ease-out group-active:scale-105"
                    style={{ bottom: `calc(${percent}% - 12px)` }}
                >
                    <div className="w-6 h-[1px] bg-white/30 mb-[2px]" />
                    <div className="w-6 h-[1px] bg-white/30" />
                    <div className="w-6 h-[1px] bg-white/30 mt-[2px]" />
                    
                    <div className="absolute w-8 h-[2px] bg-[#fc4b08] top-1/2 -translate-y-1/2 shadow-[0_0_4px_#fc4b08]" />
                </div>
            </div>
            
            <span className="mt-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider group-hover:text-white transition-colors">{label}</span>
            <span className="text-[10px] font-mono text-[#fc4b08] mt-1">{value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1)}</span>
        </div>
    );
};


const AvatarSelector: React.FC<{
    currentAvatar: string;
    onSelect: (url: string) => void;
    onClose: () => void;
}> = ({ currentAvatar, onSelect, onClose }) => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) onSelect(ev.target.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-2xl bg-white/5 border-2 border-dashed border-white/10 hover:border-[#fc4b08] hover:bg-white/10 flex flex-col items-center justify-center transition-all group"
                    title={t('settings.profile.upload')}
                >
                    <UploadIcon className="w-6 h-6 text-gray-500 group-hover:text-[#fc4b08] transition-colors" />
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                </button>
                {defaultAvatars.map((url, index) => (
                    <button
                        key={index}
                        onClick={() => onSelect(url)}
                        className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${currentAvatar === url ? 'border-[#fc4b08] ring-2 ring-[#fc4b08]/30' : 'border-transparent hover:border-white/30'}`}
                    >
                        <img src={url} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    </button>
                ))}
            </div>
            <div className="flex justify-end pt-2">
                <button onClick={onClose} className="px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white font-medium transition-colors text-sm">
                    {t('settings.profile.cancel')}
                </button>
            </div>
        </div>
    );
};

const EditProfileForm: React.FC<{
    initialName: string;
    initialImage: string;
    onSave: (name: string, image: string) => void;
    onCancel: () => void;
}> = ({ initialName, initialImage, onSave, onCancel }) => {
    const [name, setName] = useState(initialName);
    const [image, setImage] = useState(initialImage);
    const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
    const { t } = useTranslation();

    const handleRandomAvatar = () => {
        const random = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
        setImage(random);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col items-center space-y-6">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full p-1 border-2 border-[#fc4b08] shadow-[0_0_30px_rgba(252,75,8,0.3)] bg-[#121212] overflow-hidden">
                        <img src={image} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    </div>
                    <button onClick={handleRandomAvatar} className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 p-2.5 bg-[#2a2a2a] rounded-full text-white hover:bg-[#3a3a3a] hover:text-[#fc4b08] border border-white/10 transition-colors shadow-lg z-10" title={t('settings.profile.random')}>
                        <DiceIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsAvatarSelectorOpen(true)} className="absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4 p-2.5 bg-[#fc4b08] rounded-full text-black hover:bg-[#ff5f22] transition-colors shadow-lg z-10" title={t('settings.profile.chooseAvatar')}>
                        <CameraIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {isAvatarSelectorOpen ? (
                <div className="bg-black/20 p-6 rounded-3xl border border-white/5 animate-in fade-in zoom-in-95">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{t('settings.profile.chooseAvatar')}</h3>
                    <AvatarSelector currentAvatar={image} onSelect={(url) => { setImage(url); setIsAvatarSelectorOpen(false); }} onClose={() => setIsAvatarSelectorOpen(false)} />
                </div>
            ) : (
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{t('settings.profile.title')}</label>
                        <div className="relative">
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:outline-none focus:border-[#fc4b08] focus:ring-1 focus:ring-[#fc4b08] transition-all text-white text-lg font-medium placeholder-gray-600 pl-12" placeholder="Your Name" />
                            <PencilIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onCancel} className="flex-1 px-4 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-colors">{t('settings.profile.cancel')}</button>
                        <button onClick={() => onSave(name, image)} disabled={!name.trim()} className="flex-1 px-4 py-3.5 rounded-xl bg-[#fc4b08] text-black font-bold hover:bg-[#ff5f22] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#fc4b08]/20">{t('settings.profile.save')}</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const SectionProfile: React.FC = () => {
    const { name, imageUrl, updateName, updateImage } = useContext(ProfileContext);
    const { showModal, hideModal } = useContext(ModalContext);
    const { t } = useTranslation();

    const handleEditProfile = () => {
        showModal({
            title: t('settings.profile.editProfile'),
            content: <EditProfileForm initialName={name} initialImage={imageUrl} onSave={(newName, newImage) => { updateName(newName); updateImage(newImage); hideModal(); }} onCancel={hideModal} />
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SettingsHeader title={t('settings.profile.title')} description={t('settings.profile.description')} />
            <Card className="flex flex-col sm:flex-row items-center gap-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#fc4b08]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                <div className="relative">
                    <div className="w-32 h-32 rounded-full p-1 border-2 border-[#fc4b08] shadow-[0_0_40px_rgba(252,75,8,0.3)] bg-[#121212] overflow-hidden group-hover:scale-105 transition-transform duration-500">
                        <img src={imageUrl} alt={name} className="w-full h-full rounded-full object-cover" />
                    </div>
                </div>
                <div className="flex-1 text-center sm:text-left z-10">
                    <h3 className="text-4xl font-black text-white mb-2">{name}</h3>
                    <p className="text-gray-400 mb-6 max-w-md">Music Lover • Audio Enthusiast</p>
                    <button onClick={handleEditProfile} className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold transition-all hover:scale-105 hover:shadow-lg backdrop-blur-md">
                        {t('settings.profile.editProfile')}
                    </button>
                </div>
            </Card>
        </div>
    );
};

const SectionAudio: React.FC = () => {
    const { selectedQuality, setSelectedQuality } = useContext(PlayerContext);
    const { language, setLanguage, t } = useTranslation();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SettingsHeader title={t('settings.quality.title')} description="Manage your listening experience and app preferences." />
            
            <Card>
                <div className="space-y-8">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-[#fc4b08] rounded-full block" />
                            Streaming Quality
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { id: '160kbps', label: t('settings.quality.normal'), desc: t('settings.quality.normalDesc') },
                                { id: '320kbps', label: t('settings.quality.high'), desc: t('settings.quality.highDesc') },
                            ].map((q) => (
                                <button
                                    key={q.id}
                                    onClick={() => setSelectedQuality(q.id)}
                                    className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-300 ${selectedQuality === q.id ? 'border-[#fc4b08] bg-[#fc4b08]/10' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`font-bold text-lg ${selectedQuality === q.id ? 'text-[#fc4b08]' : 'text-white'}`}>{q.label}</span>
                                        {selectedQuality === q.id && <div className="w-3 h-3 bg-[#fc4b08] rounded-full shadow-[0_0_10px_#fc4b08]" />}
                                    </div>
                                    <p className="text-sm text-gray-400">{q.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-white/5 w-full" />

                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-blue-500 rounded-full block" />
                            {t('settings.language.title')}
                        </h3>
                        <div className="flex p-1 bg-black/40 rounded-xl border border-white/5 relative max-w-sm">
                            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#fc4b08] rounded-lg transition-all duration-300 shadow-lg ${language === 'pt' ? 'left-[calc(50%+2px)]' : 'left-1'}`} />
                            {(['en', 'pt'] as const).map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => setLanguage(lang)}
                                    className={`flex-1 py-3 rounded-lg text-sm font-bold relative z-10 transition-colors ${language === lang ? 'text-black' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    {lang === 'en' ? 'English' : 'Português'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const SectionEffects: React.FC = () => {
    const { isEqEnabled, setIsEqEnabled, eqSettings, setEqGain, resetEq, is8DEnabled, setIs8DEnabled, isReverbEnabled, setIsReverbEnabled, reverbMix, setReverbMix } = useContext(PlayerContext);
    const { t } = useTranslation();

    const eqPresets = { 'flat': [0,0,0,0,0], 'pop': [2,4,0,3,5], 'rock': [4,3,-2,4,6], 'jazz': [3,2,-3,3,4], 'voice': [-2,-1,4,3,1] };
    const bands = ["60Hz", "230Hz", "910Hz", "4kHz", "14kHz"];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SettingsHeader title="Sonic Lab" description={t('settings.effects.description')} />

            <div className="glass-panel-heavy p-6 md:p-8 rounded-[32px] relative overflow-hidden border border-white/5 shadow-2xl bg-[#121212]">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum-dark.png')] opacity-20 pointer-events-none" />
                
                <div className="absolute top-4 left-4 w-3 h-3 rounded-full bg-[#1a1a1a] shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),0_1px_1px_rgba(0,0,0,0.8)] border border-[#333]" />
                <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-[#1a1a1a] shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),0_1px_1px_rgba(0,0,0,0.8)] border border-[#333]" />
                <div className="absolute bottom-4 left-4 w-3 h-3 rounded-full bg-[#1a1a1a] shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),0_1px_1px_rgba(0,0,0,0.8)] border border-[#333]" />
                <div className="absolute bottom-4 right-4 w-3 h-3 rounded-full bg-[#1a1a1a] shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),0_1px_1px_rgba(0,0,0,0.8)] border border-[#333]" />

                <div className="flex flex-wrap items-center justify-between gap-6 mb-10 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shadow-inner bg-[#1a1a1a] border border-white/5`}>
                            <EqualizerIcon className={`w-6 h-6 transition-colors ${isEqEnabled ? 'text-[#fc4b08]' : 'text-gray-600'}`} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tight">Master EQ</h3>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isEqEnabled ? 'bg-[#fc4b08] shadow-[0_0_8px_#fc4b08]' : 'bg-[#333] shadow-none'}`} />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">5-Band Parametric</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-black/40 p-1.5 rounded-full border border-white/5 backdrop-blur-sm shadow-inner">
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full transition-colors ${!isEqEnabled ? 'bg-white/10 text-white' : 'text-gray-500'}`}>BYPASS</span>
                        <ToggleSwitch enabled={isEqEnabled} onChange={() => setIsEqEnabled(!isEqEnabled)} />
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full transition-colors ${isEqEnabled ? 'text-[#fc4b08]' : 'text-gray-500'}`}>ACTIVE</span>
                    </div>
                </div>

                <div className="relative z-10 transition-opacity duration-500">
                    <div className="flex justify-between items-end h-72 px-2 md:px-8 pb-4 gap-2 md:gap-4 overflow-x-auto custom-scrollbar-hidden">
                        <div className="absolute inset-x-8 top-0 bottom-16 flex flex-col justify-between pointer-events-none opacity-10">
                            <div className="w-full h-px bg-white" />
                            <div className="w-full h-px bg-white" />
                            <div className="w-full h-px bg-white" />
                        </div>

                        {eqSettings.map((band, i) => (
                            <VerticalFader 
                                key={i}
                                value={band.gain} 
                                min={-12} 
                                max={12} 
                                onChange={(val) => setEqGain(i, val)} 
                                label={bands[i]} 
                                disabled={!isEqEnabled}
                            />
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6 border-t border-white/5">
                        <div className="flex gap-2 overflow-x-auto max-w-full pb-2 md:pb-0 custom-scrollbar-hidden mask-linear-fade">
                            {(Object.keys(eqPresets) as Array<keyof typeof eqPresets>).map(preset => (
                                <button
                                    key={preset}
                                    onClick={() => {
                                        const gains = eqPresets[preset];
                                        gains.forEach((g, i) => setEqGain(i, g));
                                    }}
                                    className="px-4 py-2 rounded bg-[#1a1a1a] hover:bg-[#252525] border border-white/5 hover:border-white/10 text-[10px] font-bold text-gray-400 hover:text-white transition-all uppercase tracking-wider whitespace-nowrap active:scale-95 shadow-md"
                                >
                                    {t(`settings.effects.preset_${preset}`)}
                                </button>
                            ))}
                        </div>
                        <button onClick={resetEq} className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest px-4 py-2 hover:bg-red-500/10 rounded transition-colors">
                            {t('settings.effects.reset')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="glass-panel p-6 rounded-[24px] relative overflow-hidden group border border-white/5 bg-[#121212] shadow-2xl">
                    <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-[#222] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" />
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#222] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" />
                    <div className="absolute bottom-3 left-3 w-2 h-2 rounded-full bg-[#222] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" />
                    <div className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-[#222] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" />

                    <div className="flex items-center justify-between mb-6 relative z-10 px-2">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${is8DEnabled ? 'bg-[#00ff00] shadow-[0_0_8px_#00ff00]' : 'bg-[#330000]'} transition-colors duration-200`} />
                            <div>
                                <span className="font-bold text-lg text-white block tracking-tight">Spatial 8D</span>
                                <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Binaural Panner</span>
                            </div>
                        </div>
                        <ToggleSwitch enabled={is8DEnabled} onChange={() => setIs8DEnabled(!is8DEnabled)} />
                    </div>
                    
                    <div className="relative h-32 bg-black rounded-lg border border-white/10 flex items-center justify-center overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] mx-2">
                        <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_20%,#111_20%,#111_21%,transparent_21%,transparent_40%,#111_40%,#111_41%,transparent_41%,transparent_60%,#111_60%,#111_61%,transparent_61%)] opacity-30" />
                        <div className="absolute w-full h-[1px] bg-[#222]" />
                        <div className="absolute h-full w-[1px] bg-[#222]" />
                        
                        <div className="absolute w-8 h-8 rounded-full bg-[#222] border border-white/20 z-10" />
                        
                        <div className={`absolute w-full h-full flex items-center justify-center transition-opacity duration-500 ${is8DEnabled ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="w-[80px] h-[80px] animate-[spin_8s_linear_infinite]">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7]" />
                            </div>
                        </div>
                        
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none rounded-lg" />
                    </div>
                    <p className="mt-4 px-2 text-xs text-gray-500 font-medium leading-relaxed font-mono">
                        {is8DEnabled ? "STATUS: ORBITING // LFO: 0.2Hz" : "STATUS: BYPASSED"}
                    </p>
                </div>

                <div className="glass-panel p-6 rounded-[24px] relative overflow-hidden group border border-white/5 bg-[#121212] shadow-2xl">
                    <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-[#222] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" />
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#222] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" />
                    <div className="absolute bottom-3 left-3 w-2 h-2 rounded-full bg-[#222] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" />
                    <div className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-[#222] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" />

                    <div className="flex items-center justify-between mb-6 relative z-10 px-2">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${isReverbEnabled ? 'bg-[#00ff00] shadow-[0_0_8px_#00ff00]' : 'bg-[#330000]'} transition-colors duration-200`} />
                            <div>
                                <span className="font-bold text-lg text-white block tracking-tight">Verb Unit</span>
                                <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Plate Reverb</span>
                            </div>
                        </div>
                        <ToggleSwitch enabled={isReverbEnabled} onChange={() => setIsReverbEnabled(!isReverbEnabled)} />
                    </div>

                    <div className="relative h-16 bg-[#0a0a0a] rounded-lg border border-white/10 mb-5 overflow-hidden shadow-[inset_0_2px_5px_rgba(0,0,0,1)] mx-2">
                        <svg className="absolute bottom-0 left-0 w-full h-full p-2" viewBox="0 0 100 40" preserveAspectRatio="none">
                            <path 
                                d="M0,40 Q10,5 20,20 T40,30 T60,35 T100,38" 
                                fill="none" 
                                stroke={isReverbEnabled ? "#3b82f6" : "#222"} 
                                strokeWidth="2"
                                className="transition-colors duration-300"
                            />
                            <path 
                                d="M0,40 Q10,5 20,20 T40,30 T60,35 T100,38 L100,40 L0,40 Z" 
                                fill={isReverbEnabled ? "rgba(59, 130, 246, 0.2)" : "transparent"} 
                                className="transition-colors duration-300"
                            />
                        </svg>
                        <div className="absolute top-1 right-2 font-mono text-[9px] text-blue-500/80">
                            {isReverbEnabled ? `MIX: ${(reverbMix * 100).toFixed(0)}%` : "OFF"}
                        </div>
                    </div>

                    <div className={`px-2 transition-all duration-300 ${isReverbEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                        <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase mb-2 tracking-widest font-mono">
                            <span>Dry</span>
                            <span>Wet</span>
                        </div>
                        
                        <div className="relative h-8 w-full flex items-center group/slider">
                            <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.05" 
                                value={reverbMix} 
                                onChange={(e) => setReverbMix(parseFloat(e.target.value))} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            />
                            
                            <div className="w-full h-1.5 bg-[#050505] rounded-full border-b border-white/10 relative z-10 shadow-[inset_0_1px_2px_rgba(0,0,0,1)]"></div>
                            
                            <div 
                                className="absolute h-6 w-10 bg-gradient-to-b from-[#333] to-[#111] rounded shadow-[0_2px_4px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] border border-black z-10 pointer-events-none flex items-center justify-center transition-transform duration-75 ease-out group-active/slider:scale-105"
                                style={{ left: `calc(${reverbMix * 100}% - 20px)` }}
                            >
                                <div className="w-0.5 h-3 bg-blue-500 shadow-[0_0_4px_#3b82f6]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SectionData: React.FC = () => {
    const { importData, exportData } = useContext(UserMusicContext);
    const { showModal, hideModal } = useContext(ModalContext);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation();

    const handleExport = () => {
        const dataStr = exportData();
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `memusic_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const jsonString = event.target?.result as string;
            showModal({
                title: t('settings.data.importTitle'),
                content: (
                    <div className="space-y-4">
                        <p className="text-gray-300 text-sm leading-relaxed mb-4">{t('settings.data.importSubtitle')}</p>
                        <div className="grid gap-3">
                            <button onClick={() => processImport(jsonString, 'merge')} className="flex items-center p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 transition-all text-left group">
                                <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400 mr-4 group-hover:scale-110 transition-transform"><ImportIcon className="w-6 h-6" /></div>
                                <div><h4 className="font-bold text-white text-sm mb-1">{t('settings.data.merge')}</h4><p className="text-xs text-gray-400">{t('settings.data.mergeDesc')}</p></div>
                            </button>
                            <button onClick={() => processImport(jsonString, 'replace')} className="flex items-center p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 transition-all text-left group">
                                <div className="p-3 rounded-xl bg-red-500/20 text-red-400 mr-4 group-hover:scale-110 transition-transform"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg></div>
                                <div><h4 className="font-bold text-white text-sm mb-1">{t('settings.data.replace')}</h4><p className="text-xs text-gray-400">{t('settings.data.replaceDesc')}</p></div>
                            </button>
                        </div>
                        <button onClick={hideModal} className="w-full py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-widest">{t('settings.profile.cancel')}</button>
                    </div>
                )
            });
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const processImport = (jsonString: string, mode: 'merge' | 'replace') => {
        const result = importData(jsonString, mode);
        hideModal();
        showModal({
            title: result.success ? t('settings.data.importSuccess') : t('settings.data.importFailure'),
            content: (
                <div className="text-center space-y-6 py-4">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${result.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {result.success ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
                    </div>
                    <p className="text-white font-medium">{t(result.messageKey)}</p>
                    <button onClick={hideModal} className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 font-bold transition-colors text-xs uppercase tracking-widest">OK</button>
                </div>
            )
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SettingsHeader title={t('settings.data.title')} description={t('settings.data.description')} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onClick={() => fileInputRef.current?.click()} className="group flex flex-col items-center justify-center p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] transition-all duration-300">
                    <div className="w-16 h-16 rounded-full bg-[#fc4b08]/10 text-[#fc4b08] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(252,75,8,0.2)]">
                        <ImportIcon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{t('settings.data.import')}</h3>
                    <p className="text-sm text-gray-400 text-center">Restore from backup</p>
                    <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".json" className="hidden" />
                </button>

                <button onClick={handleExport} className="group flex flex-col items-center justify-center p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] transition-all duration-300">
                    <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                        <DownloadIcon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{t('settings.data.export')}</h3>
                    <p className="text-sm text-gray-400 text-center">Save library to file</p>
                </button>
            </div>
        </div>
    );
};

const SectionAbout: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SettingsHeader title={t('settings.about.title')} description="Project details." />
            
            <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#fc4b08]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="relative z-10 flex flex-col gap-8">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#fc4b08] to-orange-600 flex items-center justify-center shadow-lg shadow-orange-900/20 transform rotate-3 border border-white/10">
                            <span className="font-['Cute_Font'] text-4xl text-white pt-1">me</span>
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-white tracking-tighter">meMUSIC</h3>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/10 text-xs font-bold text-[#fc4b08] uppercase tracking-wider">
                                    v1.2.0
                                </span>
                                <span className="w-1 h-1 rounded-full bg-gray-600" />
                                <span className="text-xs font-medium text-gray-400">Web Player</span>
                            </div>
                        </div>
                    </div>

                    <p className="text-gray-300 text-sm leading-relaxed max-w-2xl border-l-2 border-[#fc4b08] pl-4">
                        {t('settings.about.p1')}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-black/20 border border-white/5 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Developer</div>
                                <div className="text-white font-bold">ewkekw</div>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-black/20 border border-white/5 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                <DatabaseIcon className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Data Source</div>
                                <div className="text-white font-bold">JioSaavn API</div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <a 
                            href="https://github.com/ewkekw/memusic-webplayer" 
                            target="_blank" 
                            rel="noreferrer" 
                            className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/10 hover:border-[#fc4b08]/50 group"
                        >
                            <GithubIcon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                            <span>View Source Code</span>
                        </a>
                    </div>
                </div>
            </Card>
        </div>
    );
};


const SettingsNav: React.FC<{ activeTab: SettingsTab; onSelect: (tab: SettingsTab) => void; }> = ({ activeTab, onSelect }) => {
    const tabs: { id: SettingsTab; icon: React.ReactNode; label: string }[] = [
        { id: 'profile', icon: <UserIcon className="w-5 h-5"/>, label: 'Profile' },
        { id: 'audio', icon: <SpeakerIcon className="w-5 h-5"/>, label: 'Audio' },
        { id: 'effects', icon: <EqualizerIcon className="w-5 h-5"/>, label: 'Sonic Lab' },
        { id: 'data', icon: <DatabaseIcon className="w-5 h-5"/>, label: 'Data' },
        { id: 'about', icon: <InfoIcon className="w-5 h-5"/>, label: 'About' },
    ];

    return (
        <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible p-1 md:p-0 custom-scrollbar-hidden">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onSelect(tab.id)}
                    className={`
                        flex items-center gap-3 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap
                        ${activeTab === tab.id 
                            ? 'bg-[#fc4b08] text-black shadow-[0_0_20px_rgba(252,75,8,0.3)] scale-[1.02]' 
                            : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'
                        }
                    `}
                >
                    {tab.icon}
                    <span>{tab.label}</span>
                </button>
            ))}
        </nav>
    );
};

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

    const renderContent = () => {
        switch(activeTab) {
            case 'profile': return <SectionProfile />;
            case 'audio': return <SectionAudio />;
            case 'effects': return <SectionEffects />;
            case 'data': return <SectionData />;
            case 'about': return <SectionAbout />;
            default: return <SectionProfile />;
        }
    };

    return (
        <div className="h-full flex flex-col md:flex-row overflow-hidden bg-[#050505]">
            <div className="w-full md:w-64 bg-[#121212]/50 backdrop-blur-xl border-b md:border-b-0 md:border-r border-white/5 z-20 flex-shrink-0">
                <div className="p-4 md:p-8 h-full flex flex-col">
                    <h1 className="text-2xl font-black text-white tracking-tight mb-6 hidden md:block">Settings</h1>
                    <SettingsNav activeTab={activeTab} onSelect={setActiveTab} />
                </div>
            </div>

            <main className="flex-1 overflow-y-auto custom-scrollbar relative">
                <div className="max-w-4xl mx-auto p-6 md:p-12 pb-32">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default Settings;
