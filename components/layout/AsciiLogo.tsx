import React, { useContext, useEffect, useRef } from 'react';
import { PlayerContext } from '../../context/PlayerContext';

const Logo: React.FC = () => {
  const { analyser, isPlaying } = useContext(PlayerContext);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const staticLogoRef = useRef<HTMLDivElement>(null);

  // This effect runs the canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);

      analyser.getByteFrequencyData(dataArray);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate audio metrics
      const bass = dataArray.slice(0, Math.floor(bufferLength * 0.05)).reduce((a, b) => a + b, 0) / (Math.floor(bufferLength * 0.05));
      const mids = dataArray.slice(Math.floor(bufferLength * 0.2), Math.floor(bufferLength * 0.5)).reduce((a, b) => a + b, 0) / (Math.floor(bufferLength * 0.3));
      const treble = dataArray.slice(Math.floor(bufferLength * 0.5), bufferLength).reduce((a, b) => a + b, 0) / (bufferLength - Math.floor(bufferLength * 0.5));
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Base radius pulsates with bass
      const baseRadius = (canvas.width / 6) + (bass / 255) * (canvas.width / 8);

      // Draw the "puddle"
      ctx.beginPath();
      const points = 128;
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        
        // Mids for smooth undulation
        const midOffset = Math.sin(angle * 8 + Date.now() * 0.005) * (mids / 255) * (canvas.width / 20);
        
        // Treble for spikes
        const trebleIndex = Math.floor((i / points) * (bufferLength * 0.5)) + Math.floor(bufferLength * 0.5);
        const spike = (dataArray[trebleIndex] / 255) * (canvas.width / 6) * (treble / 255);
        
        const radius = baseRadius + midOffset + spike;

        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fillStyle = '#fc4b08';
      ctx.fill();
    };

    if (isPlaying) {
        animate();
    } else {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }
        // Clear canvas when stopped
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [analyser, isPlaying]);
  
  // Effect to match canvas size to the "ME" part of the static logo
   useEffect(() => {
    const meElement = staticLogoRef.current?.querySelector('.me-logo-part');
    if (!meElement) return;

    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      if (canvasRef.current) {
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
    });

    resizeObserver.observe(meElement);
    
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className="relative text-center cursor-default select-none h-20 flex items-center justify-center">
      <div ref={staticLogoRef} className="flex items-end" style={{ fontFamily: '"Cute Font", sans-serif', fontSize: '60px', lineHeight: '0.9' }}>
         <div className="relative me-logo-part">
            <span className={`text-[#fc4b08] transition-all duration-700 ease-in-out ${isPlaying ? 'opacity-0 blur-lg scale-125' : 'opacity-100 blur-0 scale-100'}`}>
                me
            </span>
            <canvas 
                ref={canvasRef}
                className={`absolute top-0 left-0 w-full h-full transition-all duration-700 ease-in-out ${isPlaying ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
            />
         </div>
         <span className={`text-white transition-all duration-700 ease-in-out ${isPlaying ? 'opacity-80 -translate-x-4' : 'opacity-100 translate-x-0'}`}>
            MUSIC
         </span>
      </div>
    </div>
  );
};

export default Logo;