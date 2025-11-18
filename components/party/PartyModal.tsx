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
        const result = await joinParty(code.join(''));
        setLoading(false);
        if (result.success) {
            onClose();
        } else {
            setError(t(result.messageKey));
        }
    };
    
    // Auto-join if code is pre-filled from URL
    useEffect(() => {
        if (initialCode && initialCode.length === 5 && !didAttemptJoin.current) {
            handleJoin();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialCode]);

    return (
        <div className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold mb-2 text-center">{t('partyModal.joinTitle')}</h2>
            <p className="mb-6 text-center text-gray-400">{t('partyModal.joinSubtitle')}</p>
            <div className="flex justify-center gap-2 mb-4" onPaste={handlePaste}>
                {Array.from({ length: 5 }).map((_, index) => (
                    <input
                        key={index}
                        ref={(el: HTMLInputElement | null) => { inputRefs.current[index] = el; }}
                        type="text"
                        value={code[index]}
                        onChange={(e) => handleInputChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        maxLength={1}
                        className="w-11 h-14 sm:w-12 sm:h-16 bg-white/5 rounded-md text-center text-2xl sm:text-3xl font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[#fc4b08] transition-all"
                        aria-label={`Character ${index + 1} of party code`}
                    />
                ))}
            </div>

            {error && <p className="text-red-400 text-center mt-4">{error}</p>}
            <div className="flex flex-col-reverse sm:flex-row gap-4 justify-between items-center mt-8">
                <button
                    onClick={() => setView('landing')}
                    className="w-full sm:w-auto px-5 py-3 rounded-full bg-white/10 font-semibold hover:bg-white/20 transition-colors text-center"
                >
                    {t('partyModal.back')}
                </button>
                <button
                    onClick={handleJoin}
                    disabled={loading || !isCodeFull}
                    className="w-full sm:w-auto px-8 py-3 rounded-full bg-[#fc4b08] text-black font-bold hover:bg-[#ff5f22] disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? t('partyModal.joining') : t('partyModal.joinButton')}
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

const TurntableIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 8V7a1 1 0 00-1-1h-1" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 10l5-1" />
    </svg>
);


const CreateView: React.FC<{ setView: (view: 'landing' | 'share') => void, setPartyId: (id: string) => void }> = ({ setView, setPartyId }) => {
    const { startParty } = useContext(PartyContext);
    const { t } = useTranslation();
    const [mode, setMode] = useState<PartyMode>('collaborative');

    const handleCreate = () => {
        const newPartyId = startParty(mode);
        setPartyId(newPartyId);
        setView('share');
    };

    const OptionCard: React.FC<{
        title: string;
        description: string;
        icon: React.ReactNode;
        isSelected: boolean;
        onClick: () => void;
    }> = ({ title, description, icon, isSelected, onClick }) => (
        <button
             onClick={onClick}
             className={`flex-1 text-center p-6 rounded-xl border-2 transition-all duration-300 transform focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#282828] focus-visible:ring-[#fc4b08]
             ${isSelected
                 ? 'border-[#fc4b08] bg-[#fc4b08]/10 shadow-[0_0_20px_rgba(252,75,8,0.3)] scale-105'
                 : 'border-white/20 bg-white/5 hover:border-white/40 hover:scale-[1.03]'
             }`}
         >
            <div className={`mx-auto w-12 h-12 mb-4 transition-colors ${isSelected ? 'text-[#fc4b08]' : 'text-gray-400'}`}>
                {icon}
            </div>
            <h4 className="font-bold text-white text-lg">{title}</h4>
            <p className="text-sm text-gray-400 mt-1">{description}</p>
        </button>
    );

    return (
        <div className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold mb-4 text-center">{t('partyModal.createTitle')}</h2>
            <p className="mb-6 text-center text-gray-400">{t('partyModal.createSubtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
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
                    icon={<TurntableIcon />}
                    isSelected={mode === 'dj'}
                    onClick={() => setMode('dj')}
                />
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-4 justify-between items-center mt-6">
                 <button
                    onClick={() => setView('landing')}
                    className="w-full sm:w-auto px-5 py-3 rounded-full bg-white/10 font-semibold hover:bg-white/20 transition-colors text-center"
                >
                    {t('partyModal.back')}
                </button>
                <button
                    onClick={handleCreate}
                    className="w-full sm:w-auto px-8 py-3 rounded-full bg-[#fc4b08] text-black font-bold hover:bg-[#ff5f22] transition-colors"
                >
                    {t('partyModal.startButton')}
                </button>
            </div>
        </div>
    );
};

const LinkIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
);
const ShareIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.186 2.25 2.25 0 00-3.933 2.186z" /></svg>
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
        <div className="animate-in fade-in duration-300 text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-[#fc4b08]/20 flex items-center justify-center border-2 border-[#fc4b08]/50">
                <ShareIcon className="w-8 h-8 text-[#fc4b08]" />
            </div>
            <h2 className="text-3xl font-bold mb-2">{t('partyModal.shareTitle')}</h2>
            <p className="text-gray-400 mb-8">{t('partyModal.shareSubtitle')}</p>

            <div className="mb-6">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t('partyModal.partyCode')}</label>
                <div 
                    onClick={() => handleCopy(partyId, 'code')}
                    className="group relative mt-2 bg-[#181818] p-4 rounded-lg cursor-pointer border border-white/10 hover:border-[#fc4b08]/50 transition-all duration-300"
                >
                    <p className="font-mono text-5xl font-bold tracking-[0.3em] text-white ml-2">{partyId}</p>
                    <div className={`absolute inset-0 bg-[#fc4b08] rounded-md flex items-center justify-center text-black font-bold text-lg transition-all duration-300 ${copied === 'code' ? 'opacity-100' : 'opacity-0'}`}>
                        <CheckIcon className="w-6 h-6 mr-2" />
                        {t('queue.copied')}
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={() => handleCopy(partyLink, 'link')}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white/10 font-semibold hover:bg-white/20 transition-colors"
                >
                    <LinkIcon className="w-5 h-5" />
                    {copied === 'link' ? t('partyModal.linkCopied') : t('partyModal.copyInvite')}
                </button>
            </div>
            
            <div className="mt-8">
                <button onClick={onClose} className="px-8 py-2 rounded-full text-gray-300 font-semibold hover:text-white hover:bg-white/10 transition-colors">
                    {t('partyModal.done')}
                </button>
            </div>
        </div>
    );
};

const LandingView: React.FC<{ setView: (view: 'create' | 'join') => void }> = ({ setView }) => {
    const { t } = useTranslation();
    const BroadcastIcon = (props: React.SVGProps<SVGSVGElement>) => (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 013-3h.008a3 3 0 013 3v.75" /></svg>
    );

    return (
        <div className="animate-in fade-in duration-300">
            <h2 className="text-3xl font-bold mb-4 text-center">{t('partyModal.landingTitle')}</h2>
            <p className="text-gray-300 mb-8 text-center">{t('partyModal.landingSubtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-6">
                <button onClick={() => setView('create')} className="flex-1 p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-center border border-white/10 hover:border-white/20">
                    <BroadcastIcon className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                    <h3 className="font-bold text-lg text-white">{t('partyModal.createCardTitle')}</h3>
                    <p className="text-sm text-gray-400">{t('partyModal.createCardDesc')}</p>
                </button>
                 <button onClick={() => setView('join')} className="flex-1 p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-center border border-white/10 hover:border-white/20">
                    <LinkIcon className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                    <h3 className="font-bold text-lg text-white">{t('partyModal.joinCardTitle')}</h3>
                    <p className="text-sm text-gray-400">{t('partyModal.joinCardDesc')}</p>
                </button>
            </div>
        </div>
    );
};


export const PartyModal: React.FC<PartyModalProps> = ({ onClose }) => {
    const [view, setView] = useState<'landing' | 'create' | 'join' | 'share'>('landing');
    const [partyId, setPartyId] = useState('');
    const [initialPartyCode, setInitialPartyCode] = useState('');
    
    // Auto-prepare join view if party ID is in URL on component mount.
    // This is the safe way to handle this side-effect, preventing hook rule violations.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const pid = params.get('party');
        if (pid && pid.trim().length === 5) {
            setView('join');
            setInitialPartyCode(pid.toUpperCase());
            // Clean URL after reading param to prevent re-joining on reload.
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
        <div className="w-full max-w-lg">
            {renderView()}
        </div>
    );
};