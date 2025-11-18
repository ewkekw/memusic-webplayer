

import React, { useContext, useState } from 'react';
import { PartyContext } from '../../context/PartyContext';
import { useTranslation } from '../../context/LanguageContext';

const HappyEmojiIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4.072 4.072 0 01-5.656 0M9 10.5h.008v.008H9v-.008zm6 0h.008v.008H15v-.008z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


export const PartyParticipantList: React.FC = () => {
    const { partyState, sendReaction, endParty, leaveParty, isHost } = useContext(PartyContext);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const { t } = useTranslation();
    
    const emojis = ['👍', '🔥', '❤️', '🎉', '😂', '👏', '🤯', '😎'];

    if (!partyState) return null;

    const handleSendReaction = (emoji: string) => {
        sendReaction(emoji);
        setShowEmojiPicker(false);
    }
    
    const sortedParticipants = [...(partyState.participants || [])].sort((a, b) => {
        if (a.isHost) return -1;
        if (b.isHost) return 1;
        return a.name.localeCompare(b.name);
    });

    const participantCount = partyState.participants.length;

    return (
        <div>
            <div className="flex items-center -space-x-2 hover:space-x-0 transition-all duration-300 ease-in-out">
                {sortedParticipants.map(p => (
                    <img 
                        key={p.id}
                        src={p.imageUrl} 
                        alt={p.name}
                        title={`${p.name}${p.isHost ? ` (${t('queue.host')})` : ''}`}
                        className="w-10 h-10 rounded-full border-2 border-black/50 shadow-md transition-all duration-300 hover:scale-110 hover:z-10"
                    />
                ))}
            </div>
             <div className="flex items-center gap-2 mt-3">
                <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <p className="text-xs text-gray-300">
                    <span className="font-bold text-white">{participantCount}</span> {t('queue.online')}
                </p>
            </div>

            <div className="pt-4 mt-4 border-t border-white/10 relative">
                 {showEmojiPicker && (
                    <div className="absolute bottom-full mb-2 grid grid-cols-4 gap-2 bg-black/50 backdrop-blur-sm p-2 rounded-lg border border-white/10">
                        {emojis.map(emoji => (
                            <button key={emoji} onClick={() => handleSendReaction(emoji)} className="text-2xl p-2 rounded-lg hover:bg-white/20 transition-colors">{emoji}</button>
                        ))}
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowEmojiPicker(p => !p)}
                        className="w-11 h-11 flex-shrink-0 flex items-center justify-center bg-white/10 rounded-full text-gray-300 hover:text-white hover:bg-white/20 transition-colors border border-white/20"
                        title={t('queue.sendReaction')}
                    >
                        <HappyEmojiIcon className="w-6 h-6" />
                    </button>
                    <button 
                        onClick={isHost ? endParty : leaveParty} 
                        className="flex-1 h-11 bg-red-700 rounded-full text-white text-sm font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-700/20 hover:shadow-red-600/30"
                    >
                        {isHost ? t('queue.endParty') : t('queue.leaveParty')}
                    </button>
                </div>
            </div>
        </div>
    );
};
