
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface ModalContextType {
  showModal: (content: { title?: string; content: ReactNode; size?: 'md' | 'lg' | 'xl'; }) => void;
  hideModal: () => void;
}

export const ModalContext = createContext<ModalContextType>({} as ModalContextType);

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!isOpen || !mounted || !document.body) return null;
  const sizeClass = { md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' }[size];

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div 
        className="absolute inset-0 bg-[#050505]/80 backdrop-blur-2xl transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] animate-in fade-in" 
        onClick={onClose} 
      />
      
      <div 
        className={`relative bg-[#121212]/90 backdrop-blur-3xl rounded-[32px] shadow-[0_0_50px_rgba(0,0,0,0.6)] w-full max-h-[90vh] flex flex-col transform transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] animate-in fade-in zoom-in-95 scale-100 ${sizeClass} border border-white/10 ring-1 ring-white/5`} 
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="px-8 py-6 border-b border-white/5 flex-shrink-0">
            <h2 className="text-2xl font-bold text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-400">{title}</h2>
          </div>
        )}
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
          {children}
        </div>
        <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
            aria-label="Close modal"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
      </div>
    </div>,
    document.body
  );
};
