
import React, { useState, useEffect, useRef } from 'react';

interface CinematicBackgroundProps {
    songImage: string;
    isPlaying: boolean;
}

export const CinematicBackground: React.FC<CinematicBackgroundProps> = ({ songImage, isPlaying }) => {
    const [slots, setSlots] = useState<string[]>(['', '']);
    const [activeSlot, setActiveSlot] = useState<0 | 1>(0);
    const loadedImageRef = useRef<string | null>(null);

    useEffect(() => {
        if (songImage === loadedImageRef.current) return;
        
        let isCancelled = false;
        const targetImage = songImage;

        if (!targetImage) {
            loadedImageRef.current = '';
            setSlots(prev => {
                const next = [...prev];
                const nextSlot = activeSlot === 0 ? 1 : 0;
                next[nextSlot] = '';
                return next;
            });
            setActiveSlot(prev => (prev === 0 ? 1 : 0));
            return;
        }

        const img = new Image();
        img.src = targetImage;
        
        img.onload = () => {
            if (isCancelled) return;
            
            loadedImageRef.current = targetImage;
            
            setSlots(prev => {
                const next = [...prev];
                const nextSlot = activeSlot === 0 ? 1 : 0;
                next[nextSlot] = targetImage;
                return next;
            });
            
            setActiveSlot(prev => (prev === 0 ? 1 : 0));
        };

        return () => { isCancelled = true; };
    }, [songImage, activeSlot]);

    return (
        <div className={`cinematic-bg ${isPlaying ? 'is-playing' : ''}`}>
            <div 
                className="bg-layer-deep"
                style={{ 
                    backgroundImage: slots[0] ? `url(${slots[0]})` : 'none',
                    opacity: (activeSlot === 0 && slots[0]) ? 0.7 : 0 
                }}
            />
            <div 
                className="bg-layer-light"
                style={{ 
                    backgroundImage: slots[0] ? `url(${slots[0]})` : 'none',
                    opacity: (activeSlot === 0 && slots[0]) ? 0.35 : 0 
                }}
            />

            <div 
                className="bg-layer-deep"
                style={{ 
                    backgroundImage: slots[1] ? `url(${slots[1]})` : 'none',
                    opacity: (activeSlot === 1 && slots[1]) ? 0.7 : 0 
                }}
            />
            <div 
                className="bg-layer-light"
                style={{ 
                    backgroundImage: slots[1] ? `url(${slots[1]})` : 'none',
                    opacity: (activeSlot === 1 && slots[1]) ? 0.35 : 0 
                }}
            />

            <div className="orb-canvas">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
            </div>
            <div className="film-grain"></div>
            <div className="vignette"></div>
        </div>
    );
};
