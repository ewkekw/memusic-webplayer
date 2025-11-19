
import React, { useState, useContext, useRef, useEffect } from 'react';
import { PartyContext } from '../../context/PartyContext';
import { PartyMode } from '../../types';
import { useTranslation } from '../../context/LanguageContext';

interface PartyModalProps {
    onClose: () => void;
}

interface JoinViewProps {
    setView: (view: 'landing') => void;
    onClose: () => void;
    initialCode: string;
}

const JoinView: React.FC<JoinViewProps> = ({ setView, onClose, initialCode }) => {
    const { joinParty } = useContext(PartyContext);
    const { t } = useTranslation();
    const [code, setCode] = useState<string[]>(initialCode ? initialCode.split('') : Array(5).fill(''));
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const didAttemptJoin = useRef(false);

    const isCodeFull = code.join('').length === 5;

    const handleInputChange = (index: number, value: string) => {
        if (!/^[a-zA-Z0-9]*$/.test(value)) return;
        const newCode = [...code];
        newCode[index] = value.toUpperCase();
        setCode(newCode);
        if (value && index < 4) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text').toUpperCase().slice(0, 5);
        if (pastedText.length > 0 && /^[A-Z0-9]+$/.test(pastedText)) {
            const newCode = Array(5).fill('');
            pastedText.split('').forEach((char, i) => {
                if(i < 5) newCode[i] = char;
            });
            setCode(newCode);
            inputRefs.current[Math.min(4, pastedText.length - 1)]?.focus();
        }
    };
    
    const handleJoin = async () => {
        if (!isCodeFull || loading) return;
        didAttemptJoin.current = true;
        setLoading(true);
        setError('');
        
        try {
            const result = await joinParty(code.join(''));
            if (result.success) {
                onClose();
            } else {
                setError(result.errorMessage || t(result.messageKey));
            }
        } catch (e: any) {
             setError(e.message || t('party.inactive'));
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if (initialCode && initialCode.length === 5 && !didAttemptJoin.current) {
            handleJoin();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialCode]);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out">
            <h2 className="text-3xl font-black mb-3 text-center tracking-tight text-white">{t('partyModal.joinTitle')}</h2>
            <p className="mb-8 text-center text-gray-400 text-sm">{t('partyModal.joinSubtitle')}</p>
            
            <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
                {Array.from({ length: 5 }).map((_, index) => (
                    <input
                        key={index}
                        ref={(el: HTMLInputElement | null) => { inputRefs.current[index] = el; }}
                        type="text"
                        value={code[index]}
                        onChange={(e) => handleInputChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        maxLength={1}
                        className={`w-12 h-16 sm:w-14 sm:h-20 bg-black/20 border-2 rounded-lg text-center text-3xl font-bold uppercase transition-all duration-200 caret-transparent focus:outline-none
                            ${code[index] ? 'border-[#fc4b08] text-[#fc4b08] bg-[#fc4b08]/5' : 'border-white/10 text-white focus:border-white/30 focus:bg-white/5'}`}
                        aria-label={`Character ${index + 1} of party code`}
                    />
                ))}
            </div>

            {error && (
                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center animate-in fade-in">
                    {error}
                </div>
            )}
            
            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-between items-center">
                <button
                    onClick={() => setView('landing')}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium transition-colors text-sm border border-white/5"
                >
                    {t('partyModal.back')}
                </button>
                <button
                    onClick={handleJoin}
                    disabled={loading || !isCodeFull}
                    className="w-full sm:w-auto px-10 py-3 rounded-xl bg-[#fc4b08] text-black font-bold hover:bg-[#ff5f22] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#fc4b08]/20 hover:shadow-[#fc4b08]/40 text-sm transform active:scale-95 duration-100 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"/>
                            {t('partyModal.joining')}
                        </>
                    ) : t('partyModal.joinButton')}
                </button>
            </div>
        </div>
    );
};

const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);

const MixerIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 9.75V10.5" />
    </svg>
);

const WifiOffIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <line x1="1" y1="1" x2="23" y2="23"></line>
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
        <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
        <line x1="12" y1="20" x2="12.01" y2="20"></line>
    </svg>
);

const CreateView: React.FC<{ setView: (view: 'landing' | 'share') => void, setPartyId: (id: string) => void }> = ({ setView, setPartyId }) => {
    const { startParty } = useContext(PartyContext);
    const { t } = useTranslation();
    const [mode, setMode] = useState<PartyMode>('collaborative');
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        setCreating(true);
        setError(null);
        setStatus("Initializing...");
        
        try {
            const newPartyId = await startParty(mode, (statusUpdate) => {
                setStatus(statusUpdate);
            });
            setPartyId(newPartyId);
            setView('share');
        } catch (e: any) {
            console.error("Failed to create party", e);
            // If it's our specific connection error code, simplified message
            if (e.message === 'CONNECTION_FAILED') {
                setError('CONNECTION_FAILED');
            } else {
                setError(e.message || "Unknown error");
            }
        } finally {
            setCreating(false);
            setStatus(null);
        }
    };

    // CLEAN ERROR VIEW (Replaces the entire view content)
    if (error === 'CONNECTION_FAILED') {
        return (
            <div className="animate-in fade-in zoom-in-95 duration-300 ease-out text-center flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6">
                    <WifiOffIcon className="w-10 h-10 text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Connection Blocked</h2>
                <p className="text-gray-400 mb-8 text-sm leading-relaxed max-w-xs">
                    Your network seems to be restricting peer-to-peer connections. This is common with VPNs or corporate firewalls.
                </p>
                <div className="flex gap-4 w-full justify-center">
                     <button
                        onClick={() => setError(null)}
                        className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium transition-colors text-sm border border-white/5"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        className="px-8 py-3 rounded-xl bg-[#fc4b08] text-black font-bold hover:bg-[#ff5f22] shadow-lg shadow-[#fc4b08]/20 hover:shadow-[#fc4b08]/40 transition-all text-sm"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const OptionCard: React.FC<{
        title: string;
        description: string;
        icon: React.ReactNode;
        isSelected: boolean;
        onClick: () => void;
    }> = ({ title, description, icon, isSelected, onClick }) => (
        <button
             onClick={onClick}
             className={`group relative flex flex-col items-center text-center p-6 rounded-xl border-2 transition-all duration-200 ease-out focus:outline-none w-full h-full
             ${isSelected
                 ? 'border-[#fc4b08] bg-[#fc4b08]/10 shadow-[0_0_20px_rgba(252,75,8,0.1)]'
                 : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
             }`}
         >
            <div className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${isSelected ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                 <div className="w-full h-full bg-[#fc4b08] rounded-full flex items-center justify-center shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-black">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                 </div>
            </div>

            <div className={`w-16 h-16 mb-5 flex items-center justify-center rounded-2xl transition-colors duration-200 ${isSelected ? 'bg-[#fc4b08] text-black' : 'bg-white/10 text-gray-400 group-hover:text-white'}`}>
                {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-8 h-8' })}
            </div>
            
            <h4 className={`font-bold text-lg mb-2 transition-colors duration-200 ${isSelected ? 'text-white' : 'text-gray-200 group-hover:text-white'}`}>{title}</h4>
            <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
        </button>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out">
            <h2 className="text-3xl font-black mb-3 text-center tracking-tight text-white">{t('partyModal.createTitle')}</h2>
            <p className="mb-8 text-center text-gray-400 text-sm">{t('partyModal.createSubtitle')}</p>
            
            {error && (
                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center animate-in fade-in">
                    {error}
                </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <OptionCard
                    title={t('partyModal.collaborative')}
                    description={t('partyModal.collaborativeDesc')}
                    icon={<UsersIcon />}
                    isSelected={mode === 'collaborative'}
                    onClick={() => setMode('collaborative')}
                />
                <OptionCard
                    title={t('partyModal.djHost')}
                    description={t('partyModal.djHostDesc')}
                    icon={<MixerIcon />}
                    isSelected={mode === 'dj'}
                    onClick={() => setMode('dj')}
                />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-between items-center">
                 <button
                    onClick={() => setView('landing')}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium transition-colors text-sm border border-white/5"
                >
                    {t('partyModal.back')}
                </button>
                <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="w-full sm:w-auto px-10 py-3 rounded-xl bg-[#fc4b08] text-black font-bold hover:bg-[#ff5f22] shadow-lg shadow-[#fc4b08]/20 hover:shadow-[#fc4b08]/40 transition-all text-sm transform active:scale-95 duration-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                     {creating ? (
                        <>
                            <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"/>
                            <span>{status || "Starting..."}</span>
                        </>
                    ) : t('partyModal.startButton')}
                </button>
            </div>
        </div>
    );
};

const LinkIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
);
const ShareIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.186 2.25 2.25 0 00-3.933 2.186z" /></svg>
);
const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
);

const ShareView: React.FC<{ partyId: string, onClose: () => void }> = ({ partyId, onClose }) => {
    const { t } = useTranslation();
    const [copied, setCopied] = useState<'code' | 'link' | null>(null);
    const partyLink = `${window.location.origin}?party=${partyId}`;

    const handleCopy = (textToCopy: string, type: 'code' | 'link') => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(type);
            setTimeout(() => setCopied(null), 2000);
        });
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out text-center">
            <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-[#fc4b08]/10 flex items-center justify-center border border-[#fc4b08]/20 animate-bounce-small">
                <ShareIcon className="w-10 h-10 text-[#fc4b08]" />
            </div>
            <h2 className="text-3xl font-black mb-2 tracking-tight text-white">{t('partyModal.shareTitle')}</h2>
            <p className="text-gray-400 mb-8 text-sm max-w-xs mx-auto leading-relaxed">{t('partyModal.shareSubtitle')}</p>

            <div className="mb-8">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">{t('partyModal.partyCode')}</div>
                <div 
                    onClick={() => handleCopy(partyId, 'code')}
                    className="group relative inline-block bg-[#1a1a1a] px-10 py-5 rounded-2xl cursor-pointer border border-white/10 hover:border-[#fc4b08]/50 transition-all duration-200 active:scale-95 shadow-inner"
                >
                    <p className="font-mono text-5xl sm:text-6xl font-bold tracking-widest text-white drop-shadow-md">{partyId}</p>
                    
                    <div className={`absolute inset-0 bg-[#fc4b08] rounded-2xl flex items-center justify-center text-black font-bold text-lg transition-opacity duration-200 ${copied === 'code' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <CheckIcon className="w-6 h-6 mr-2" />
                        {t('queue.copied')}
                    </div>
                </div>
            </div>

            <div className="flex justify-center mb-8">
                <button
                    onClick={() => handleCopy(partyLink, 'link')}
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 border text-sm w-full sm:w-auto transform active:scale-95
                    ${copied === 'link' 
                        ? 'bg-green-500/10 border-green-500/50 text-green-400' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white'}`}
                >
                    {copied === 'link' ? <CheckIcon className="w-5 h-5" /> : <LinkIcon className="w-5 h-5 text-gray-400" />}
                    {copied === 'link' ? t('partyModal.linkCopied') : t('partyModal.copyInvite')}
                </button>
            </div>
            
            <div className="pt-6 border-t border-white/5">
                <button onClick={onClose} className="text-gray-500 hover:text-white font-medium text-sm transition-colors px-6 py-2">
                    {t('partyModal.done')}
                </button>
            </div>
        </div>
    );
};

const LandingView: React.FC<{ setView: (view: 'create' | 'join') => void }> = ({ setView }) => {
    const { t } = useTranslation();
    const BroadcastIcon = (props: React.SVGProps<SVGSVGElement>) => (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 013-3h.008a3 3 0 013 3v.75" /></svg>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out">
            <h2 className="text-4xl font-black mb-4 text-center tracking-tighter text-white">{t('partyModal.landingTitle')}</h2>
            <p className="text-gray-400 mb-10 text-center max-w-xs mx-auto leading-relaxed text-sm">{t('partyModal.landingSubtitle')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => setView('create')} className="flex flex-col items-center p-8 rounded-3xl bg-[#282828] border border-white/5 hover:border-[#fc4b08]/50 hover:bg-[#2f2f2f] transition-all duration-300 group text-center transform active:scale-[0.98] shadow-lg hover:shadow-xl">
                    <div className="w-16 h-16 rounded-2xl bg-black/40 flex items-center justify-center mb-5 border border-white/5 group-hover:border-[#fc4b08]/30 transition-colors duration-300">
                        <BroadcastIcon className="w-8 h-8 text-[#fc4b08]" />
                    </div>
                    <h3 className="font-bold text-xl text-white mb-2">{t('partyModal.createCardTitle')}</h3>
                    <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{t('partyModal.createCardDesc')}</p>
                </button>
                 <button onClick={() => setView('join')} className="flex flex-col items-center p-8 rounded-3xl bg-[#282828] border border-white/5 hover:border-white/30 hover:bg-[#2f2f2f] transition-all duration-300 group text-center transform active:scale-[0.98] shadow-lg hover:shadow-xl">
                    <div className="w-16 h-16 rounded-2xl bg-black/40 flex items-center justify-center mb-5 border border-white/5 group-hover:border-white/20 transition-colors duration-300">
                        <LinkIcon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold text-xl text-white mb-2">{t('partyModal.joinCardTitle')}</h3>
                    <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{t('partyModal.joinCardDesc')}</p>
                </button>
            </div>
        </div>
    );
};


export const PartyModal: React.FC<PartyModalProps> = ({ onClose }) => {
    const [view, setView] = useState<'landing' | 'create' | 'join' | 'share'>('landing');
    const [partyId, setPartyId] = useState('');
    const [initialPartyCode, setInitialPartyCode] = useState('');
    
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const pid = params.get('party');
        if (pid && pid.trim().length === 5) {
            setView('join');
            setInitialPartyCode(pid.toUpperCase());
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const renderView = () => {
        switch (view) {
            case 'create':
                return <CreateView setView={setView} setPartyId={setPartyId} />;
            case 'join':
                return <JoinView setView={setView} onClose={onClose} initialCode={initialPartyCode} />;
            case 'share':
                return <ShareView partyId={partyId} onClose={onClose} />;
            case 'landing':
            default:
                return <LandingView setView={setView} />;
        }
    }

    return (
        <div className="w-full max-w-xl p-2">
            {renderView()}
        </div>
    );
};
