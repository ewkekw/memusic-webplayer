

import React, { useContext, useEffect, useState, useRef } from 'react';
import { PartyContext } from '../../context/PartyContext';

interface FloatingEmoji {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  vy: number;
  vx: number;
  sway: number;
  swaySpeed: number;
  swayMagnitude: number;
  rotation: number;
  rotationSpeed: number;
  age: number;
  maxAge: number;
}

export const EphemeralReactions: React.FC = () => {
  const { partyState } = useContext(PartyContext);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const lastReactionId = React.useRef<string | null>(null);

  useEffect(() => {
    if (partyState?.reactions && partyState.reactions.length > 0) {
      const latestReaction = partyState.reactions[partyState.reactions.length - 1];
      
      if (latestReaction.id !== lastReactionId.current) {
        lastReactionId.current = latestReaction.id;

        const newEmoji: FloatingEmoji = {
            id: latestReaction.id,
            emoji: latestReaction.emoji,
            x: Math.random() * 20 + 75,
            y: 95,
            size: Math.random() * 24 + 32,
            opacity: 1,
            vy: -1 - Math.random() * 0.8,
            vx: (Math.random() - 0.5) * 0.3,
            sway: Math.random() * Math.PI * 2,
            swaySpeed: 0.05 + Math.random() * 0.05,
            swayMagnitude: 0.15 + Math.random() * 0.1,
            rotation: Math.random() * 40 - 20,
            rotationSpeed: (Math.random() - 0.5) * 1.5,
            age: 0,
            maxAge: 100 + Math.random() * 50,
        };
        setFloatingEmojis(prev => [...prev.slice(-15), newEmoji]);
      }
    }
  }, [partyState?.reactions]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFloatingEmojis(currentEmojis =>
        currentEmojis
          .map(emoji => {
            const lifeRatio = emoji.age / emoji.maxAge;
            return {
              ...emoji,
              age: emoji.age + 1,
              y: emoji.y + emoji.vy,
              vy: emoji.vy * 0.98 + 0.02,
              x: emoji.x + emoji.vx + Math.sin(emoji.sway) * emoji.swayMagnitude,
              sway: emoji.sway + emoji.swaySpeed,
              vx: emoji.vx * 0.97,
              rotation: emoji.rotation + emoji.rotationSpeed,
              rotationSpeed: emoji.rotationSpeed * 0.97,
              opacity: 1 - Math.pow(lifeRatio, 2.5),
            };
          })
          .filter(emoji => emoji.age < emoji.maxAge)
      );
    }, 33);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-[100] pointer-events-none overflow-hidden">
      {floatingEmojis.map(emoji => (
        <div
          key={emoji.id}
          className="absolute"
          style={{
            left: `${emoji.x}%`,
            top: `${emoji.y}%`,
            fontSize: `${emoji.size}px`,
            opacity: emoji.opacity,
            transform: `translateX(-50%) rotate(${emoji.rotation}deg)`,
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            willChange: 'transform, opacity',
          }}
        >
          {emoji.emoji}
        </div>
      ))}
    </div>
  );
};
