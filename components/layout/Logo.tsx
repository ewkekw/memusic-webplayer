import React, { useContext, useEffect, useRef } from 'react';
import { PlayerContext } from '../../context/PlayerContext';

interface LogoProps {
  size?: 'small' | 'large';
}

// Types for visualizer elements
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  initialRadius: number;
  radius: number;
  life: number;
  maxLife: number;
}

interface Star {
  x: number;
  y: number;
  z: number;
}


const Logo: React.FC<LogoProps> = ({ size = 'large' }) => {
  const { analyser, isPlaying } = useContext(PlayerContext);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const staticLogoRef = useRef<HTMLDivElement>(null);
  const isLarge = size === 'large';
  
  // Refs for visualizer state to persist across renders
  const particles = useRef<Particle[]>([]);
  const stars = useRef<Star[]>([]);
  const smoothedBass = useRef(0);
  const smoothedMids = useRef(0);
  const smoothedTreble = useRef(0);
  
  // Beat detection refs
  const bassHistory = useRef<number[]>([]);
  const lastKickTime = useRef(0);
  const emissionCounter = useRef(0);


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
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // --- Calculate and smooth audio metrics ---
      const bass = dataArray.slice(0, Math.floor(bufferLength * 0.05)).reduce((a, b) => a + b, 0) / (Math.floor(bufferLength * 0.05)) || 0;
      const mids = dataArray.slice(Math.floor(bufferLength * 0.2), Math.floor(bufferLength * 0.5)).reduce((a, b) => a + b, 0) / (Math.floor(bufferLength * 0.3)) || 0;
      const treble = dataArray.slice(Math.floor(bufferLength * 0.5), bufferLength).reduce((a, b) => a + b, 0) / (bufferLength - Math.floor(bufferLength * 0.5)) || 0;

      const smoothingFactor = 0.1;
      smoothedBass.current += (bass - smoothedBass.current) * smoothingFactor;
      smoothedMids.current += (mids - smoothedMids.current) * smoothingFactor;
      smoothedTreble.current += (treble - smoothedTreble.current) * smoothingFactor;
      
      // --- Draw Stars (Background) ---
      stars.current.forEach(star => {
          star.z -= 0.2;
          if (star.z <= 0) {
              star.x = (Math.random() - 0.5) * canvas.width * 1.5;
              star.y = (Math.random() - 0.5) * canvas.height * 1.5;
              star.z = canvas.width;
          }

          const k = 128 / star.z;
          const px = star.x * k + centerX;
          const py = star.y * k + centerY;

          if (px > 0 && px < canvas.width && py > 0 && py < canvas.height) {
              const size = (1 - star.z / canvas.width) * 2;
              const alpha = (1 - star.z / canvas.width) * (0.3 + (smoothedTreble.current / 255) * 0.7);
              ctx.fillStyle = `rgba(252, 75, 8, ${alpha})`;
              ctx.beginPath();
              ctx.arc(px, py, size, 0, Math.PI * 2);
              ctx.fill();
          }
      });
      
      // --- Draw Central Blob ---
      const baseRadius = (canvas.width / 7) + (smoothedBass.current / 255) * (canvas.width / 10);
      
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 1.2);
      // Ensure center is bright orange, not yellow/white.
      const brightCenter = `hsl(25, 97%, ${55 + (smoothedTreble.current / 255) * 15}%)`; 
      gradient.addColorStop(0, brightCenter);
      gradient.addColorStop(0.6, '#fc4b08');
      gradient.addColorStop(1, `hsl(25, 100%, ${30 + (smoothedBass.current/255) * 10}%)`);

      ctx.fillStyle = gradient;

      ctx.beginPath();
      const points = 128;
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const midOffset = Math.sin(angle * 8 + Date.now() * 0.005) * (smoothedMids.current / 255) * (canvas.width / 25);
        const trebleIndex = Math.floor((i / points) * (bufferLength * 0.5)) + Math.floor(bufferLength * 0.5);
        const spike = (dataArray[trebleIndex] / 255) * (canvas.width / 8) * (smoothedTreble.current / 255);
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
      ctx.fill();
      
      // --- Particle Emission (Continuous + Burst) ---
      const emitParticle = (speedMultiplier = 1) => {
          const angle = Math.random() * Math.PI * 2;
          const speed = (0.2 + Math.random() * 0.5) * speedMultiplier;
          const startRadius = baseRadius * (0.8 + Math.random() * 0.2);
          const life = 80 + Math.random() * 40;
          const radius = 1 + Math.random() * 2;
          particles.current.push({
              x: centerX + Math.cos(angle) * startRadius,
              y: centerY + Math.sin(angle) * startRadius,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              initialRadius: radius,
              radius: radius,
              life: life,
              maxLife: life,
          });
      };

      // Continuous "effervescence" based on bass level
      const continuousEmissionRate = (smoothedBass.current / 255) * 1.5; // Max ~1.5 particles per frame
      emissionCounter.current += continuousEmissionRate;
      while (emissionCounter.current > 1) {
          emitParticle(0.5); // Slower particles for the continuous bubbling
          emissionCounter.current -= 1;
      }
      
      // Burst on kick
      bassHistory.current.push(bass);
      if (bassHistory.current.length > 30) bassHistory.current.shift();
      const avgBass = bassHistory.current.reduce((a, b) => a + b, 0) / bassHistory.current.length;
      const kickThreshold = 1.25;
      const cooldown = 120; // ms
      const now = Date.now();
      
      if (bass > avgBass * kickThreshold && now - lastKickTime.current > cooldown) {
        lastKickTime.current = now;
        const kickStrength = Math.min(2.5, (bass - avgBass) / 40);
        const particleCount = Math.floor(1 + kickStrength * 1.5);
        for (let i = 0; i < particleCount; i++) {
            emitParticle(1 + kickStrength * 0.5); // Faster particles for the kick
        }
      }
      
      // --- Update & Draw Particles ---
      particles.current = particles.current.filter(p => p.life > 0 && p.radius > 0.1);
      particles.current.forEach(p => {
          p.life--;
          
          const dx = centerX - p.x;
          const dy = centerY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Heavier gravity to pull them back and contain them
          const gravity = 0.18;
          p.vx += (dx / dist) * gravity;
          p.vy += (dy / dist) * gravity;
          
          // Heavier damping/friction
          p.vx *= 0.94;
          p.vy *= 0.94;

          p.x += p.vx;
          p.y += p.vy;
          
          // Radius shrinks over the particle's lifetime for a fade-out effect.
          p.radius = p.initialRadius * (p.life / p.maxLife);

          // When re-entering the blob, it shrinks even faster to simulate re-absorption.
          if (dist < baseRadius * 1.1) {
              p.radius *= 0.92;
          }
          
          ctx.fillStyle = '#fc4b08';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
      });
    };

    if (isPlaying) {
        animate();
    } else {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.current = [];
        bassHistory.current = [];
        smoothedBass.current = 0;
        smoothedMids.current = 0;
        smoothedTreble.current = 0;
        emissionCounter.current = 0;
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [analyser, isPlaying]);
  
  // Effect to match canvas size and initialize stars
   useEffect(() => {
    const meElement = staticLogoRef.current?.querySelector('.me-logo-part');
    if (!meElement) return;
    
    const initStars = (width: number, height: number) => {
        const starCount = 100;
        stars.current = [];
        for (let i = 0; i < starCount; i++) {
            stars.current.push({
                x: (Math.random() - 0.5) * width * 1.5,
                y: (Math.random() - 0.5) * height * 1.5,
                z: Math.random() * width,
            });
        }
    };

    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      if (canvasRef.current) {
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        initStars(width, height);
      }
    });

    resizeObserver.observe(meElement);
    
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className={`relative text-center cursor-default select-none flex items-center justify-center ${isLarge ? 'h-20' : 'h-16'}`}>
      <div ref={staticLogoRef} className="flex items-end" style={{ fontFamily: '"Cute Font", sans-serif', fontSize: isLarge ? '60px' : '48px', lineHeight: '0.9' }}>
         <div className="relative me-logo-part">
            <span className={`text-[#fc4b08] transition-all duration-700 ease-in-out ${isPlaying ? 'opacity-0 blur-lg scale-125' : 'opacity-100 blur-0 scale-100'}`}>
                me
            </span>
            <canvas 
                ref={canvasRef}
                className={`absolute top-0 left-0 w-full h-full transition-all duration-700 ease-in-out ${isPlaying ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
            />
         </div>
         <span className={`text-white transition-all duration-700 ease-in-out ${isPlaying ? 'opacity-80 -translate-x-0.2' : 'opacity-100 translate-x-0'}`}>
            MUSIC
         </span>
      </div>
    </div>
  );
};

export default Logo;
