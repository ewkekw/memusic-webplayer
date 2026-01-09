
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

interface SmartMenuProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement>;
  children: React.ReactNode;
  width?: string;
  className?: string;
}

export const SmartMenu: React.FC<SmartMenuProps> = ({ isOpen, onClose, triggerRef, children, width = 'w-56', className = '' }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0, pointerEvents: 'none' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (isOpen && mounted && triggerRef.current) {
      const updatePosition = () => {
          if (!triggerRef.current || !menuRef.current) return;
          
          const triggerRect = triggerRef.current.getBoundingClientRect();
          const menuRect = menuRef.current.getBoundingClientRect();
          
          const viewportW = window.innerWidth;
          const viewportH = window.innerHeight;
          
          let top = triggerRect.bottom + 8;
          let left = triggerRect.left;
          let origin = 'top left';
          
          if (top + menuRect.height > viewportH - 20) {
              top = triggerRect.top - 8 - menuRect.height;
              origin = origin.replace('top', 'bottom');
          }
          
          if (left + menuRect.width > viewportW - 20) {
              left = triggerRect.right - menuRect.width + triggerRect.width;
              origin = origin.replace('left', 'right');
          }
          
          if (left < 10) left = 10;

          setStyle({
              position: 'fixed',
              top: `${top}px`,
              left: `${left}px`,
              transformOrigin: origin,
              opacity: 1,
              pointerEvents: 'auto',
              zIndex: 1100,
          });
      };
      
      updatePosition();
      
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
          window.removeEventListener('scroll', updatePosition, true);
          window.removeEventListener('resize', updatePosition);
      };
    } else {
        setStyle({ opacity: 0, pointerEvents: 'none' });
    }
  }, [isOpen, mounted, triggerRef]);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (isOpen && 
              menuRef.current && !menuRef.current.contains(event.target as Node) && 
              triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
              onClose();
          }
      };
      
      if (isOpen) {
          document.addEventListener('mousedown', handleClickOutside);
      }
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen || !mounted || !document.body) return null;

  return createPortal(
    <div 
        ref={menuRef} 
        style={style}
        className={`fixed bg-[#181818]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-1.5 transition-all duration-200 animate-in fade-in zoom-in-95 ${width} ${className}`}
        onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
};
