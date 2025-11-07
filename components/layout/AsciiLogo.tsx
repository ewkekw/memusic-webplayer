import React, { useContext, useEffect, useRef } from 'react';
import { PlayerContext } from '../../context/PlayerContext';

const meAscii = [
  "███╗   ███╗ ███████╗ ",
  "████╗ ████║ ██╔════╝ ",
  "██╔████╔██║ █████╗   ",
  "██║╚██╔╝██║ ██╔══╝   ",
  "██║ ╚═╝ ██║ ███████╗ ",
  "╚═╝     ╚═╝ ╚══════╝ ",
];

const musicAscii = [
  "███╗   ███╗ ██╗   ██╗ ███████╗ ██╗  ██████╗",
  "████╗ ████║ ██║   ██║ ██╔════╝ ██║ ██╔════╝",
  "██╔████╔██║ ██║   ██║ ███████╗ ██║ ██║     ",
  "██║╚██╔╝██║ ██║   ██║ ╚════██║ ██║ ██║     ",
  "██║ ╚═╝ ██║ ╚██████╔╝ ███████║ ██║ ╚██████╗",
  "╚═╝     ╚═╝  ╚═════╝  ╚══════╝ ╚═╝  ╚═════╝",
];

const baseLogo = meAscii.map((line, i) => line + musicAscii[i]);
const splitPoint = meAscii[0].length;


const AsciiLogo: React.FC = () => {
  const { analyser, isPlaying } = useContext(PlayerContext);
  const requestRef = useRef<number | null>(null);
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);

      if (!analyser || !isPlaying || !preRef.current) {
        if (preRef.current) {
          const spans = preRef.current.querySelectorAll('.ascii-char') as NodeListOf<HTMLSpanElement>;
          spans.forEach(span => {
            span.style.transform = 'translateY(0px)';
          });
        }
        return;
      }

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);

      // Calculate the average volume across all frequency bins to drive the animation.
      // This makes the entire logo react to the music's intensity.
      let sum = 0;
      for(let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
      }
      const averageLevel = sum / dataArray.length;

      const lines = preRef.current.children;
      if (!lines || lines.length === 0) return;
      
      for (let i = 0; i < lines.length; i++) {
        const lineDiv = lines[i];
        const spans = lineDiv.querySelectorAll('.ascii-char') as NodeListOf<HTMLSpanElement>;

        for (let j = 0; j < spans.length; j++) {
          const span = spans[j];
          
          // Use the average level to determine glitch probability and magnitude.
          // The power function makes the effect more pronounced on peaks.
          const glitchProbability = Math.pow(averageLevel / 140, 4); 

          if (Math.random() < glitchProbability) {
            const maxShift = 4; // max vertical shift in pixels
            const shiftMagnitude = Math.pow(averageLevel / 180, 2) * maxShift;
            const shift = (Math.random() - 0.5) * 2 * shiftMagnitude;
            span.style.transform = `translateY(${shift.toFixed(2)}px)`;
          } else {
            span.style.transform = 'translateY(0px)';
          }
        }
      }
    };
    
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [analyser, isPlaying]);

  return (
    <pre 
        ref={preRef} 
        className="font-mono whitespace-pre text-center cursor-default select-none"
        style={{ fontSize: 'clamp(4px, 0.4vw, 5.5px)', lineHeight: '1.2' }}
    >
      {baseLogo.map((line, i) => (
        <div key={i} className="flex justify-center">
          {line.split('').map((char, j) => {
            const isMePart = j < splitPoint;
            const colorClass = isMePart ? 'text-white' : 'text-[#fc4b08]';
            return (
              <span 
                key={j} 
                className={`ascii-char ${colorClass}`}
                style={{ transition: 'transform 0.05s ease-out' }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            );
          })}
        </div>
      ))}
    </pre>
  );
};

export default AsciiLogo;
