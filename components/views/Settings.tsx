

import React, { useContext, useRef, useState, useEffect } from 'react';
import { PlayerContext } from '../../context/PlayerContext';
import { UserMusicContext } from '../../context/UserMusicContext';
import { ModalContext } from '../../App';

const Section: React.FC<{title: string, description: string, children: React.ReactNode}> = ({ title, description, children }) => (
    <section>
        <div>
            <h3 className="text-2xl font-bold text-white">{title}</h3>
            <p className="mt-1 text-gray-400">{description}</p>
        </div>
        <div className="mt-6 bg-white/5 shadow rounded-lg p-6">
            {children}
        </div>
    </section>
);

const ImportExportSection: React.FC = () => {
    const { importData, exportData } = useContext(UserMusicContext);
    const { showModal, hideModal } = useContext(ModalContext);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        const jsonString = exportData();
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `memusic_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = (mode: 'replace' | 'merge') => {
        hideModal();
        const file = fileInputRef.current?.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = importData(e.target?.result as string, mode);
                showModal({
                    title: result.success ? "Import Successful" : "Import Failed",
                    content: (
                        <>
                            <p className="text-gray-300 mb-6">{result.message}</p>
                            <div className="flex justify-end">
                                <button onClick={hideModal} className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20">Close</button>
                            </div>
                        </>
                    ),
                });
            };
            reader.readAsText(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const onFileSelected = () => {
        if (!fileInputRef.current?.files?.length) return;
        const MergeIcon = (props: React.SVGProps<SVGSVGElement>) => (
            <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.962 3.935l.387.216m-8.634 8.634l.216.387m16.402-4.634l.387-.216m-8.634-8.634l.216-.387M3.75 20.25h16.5M16.5 3.75h-1.875a4.5 4.5 0 00-4.5 4.5v.375m-1.875 0v5.25a3 3 0 01-3 3h-1.5m1.5-3h5.25m-5.25 0h1.875a3 3 0 003-3V8.25a4.5 4.5 0 00-4.5-4.5H6.375" /></svg>
        );
        const ReplaceIcon = (props: React.SVGProps<SVGSVGElement>) => (
            <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-11.667-11.667l3.181 3.183m0 0l-3.181 3.183m0 0l3.181-3.183M3.75 5.25h4.992m0 0v4.992m0-4.992L5.578 3.47m11.667 11.667l3.181-3.183m0 0l-3.181-3.183m0 0l-3.181 3.183" /></svg>
        );

        showModal({
            title: "Import Your Library",
            content: (
                 <div>
                    <p className="text-gray-300 mb-4">Choose how to import from your backup file.</p>
                    <div className="space-y-4">
                        <button onClick={() => handleImport('merge')} className="w-full text-left p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center space-x-4">
                             <MergeIcon className="w-10 h-10 text-gray-400 flex-shrink-0" />
                            <div className="flex-1">
                                <h4 className="font-bold text-white">Merge</h4>
                                <p className="text-sm text-gray-400">Add new items from the backup to your current library. No data will be deleted.</p>
                            </div>
                        </button>
                        <button onClick={() => handleImport('replace')} className="w-full text-left p-4 rounded-lg bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 transition-colors flex items-center space-x-4">
                            <ReplaceIcon className="w-10 h-10 text-red-400 flex-shrink-0" />
                            <div className="flex-1">
                                <h4 className="font-bold text-red-300">Replace</h4>
                                <p className="text-sm text-red-400">Warning: This will delete your current library before importing the backup.</p>
                            </div>
                        </button>
                    </div>
                    <div className="flex justify-end mt-6">
                        <button onClick={hideModal} className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20">Cancel</button>
                    </div>
                </div>
            )
        });
    }

    return (
        <Section title="Manage Data" description="Backup your library to a file or restore it from a backup.">
            <div className="flex flex-col sm:flex-row gap-4">
                 <input type="file" ref={fileInputRef} onChange={onFileSelected} accept=".json" className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="flex-1 text-center px-4 py-3 border border-gray-600 rounded-md text-sm font-medium text-gray-300 hover:bg-white/10 transition-colors">
                    Import Library
                </button>
                <button onClick={handleExport} className="flex-1 text-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-[#fc4b08] hover:bg-[#ff5f22] transition-colors">
                    Export Library
                </button>
            </div>
        </Section>
    );
};

const ToggleSwitch: React.FC<{label: string, enabled: boolean, onChange: () => void}> = ({ label, enabled, onChange }) => (
    <div className="flex items-center justify-between">
        <span className="font-medium text-white">{label}</span>
        <button
            onClick={onChange}
            className={`${enabled ? 'bg-[#fc4b08]' : 'bg-gray-600'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors`}
        >
            <span className={`${enabled ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} />
        </button>
    </div>
);

const Audio8DIcon: React.FC<{ isEnabled: boolean }> = ({ isEnabled }) => {
    const { audioContext } = useContext(PlayerContext);
    const orbitingElementRef = useRef<SVGGElement>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isEnabled || !audioContext) {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            if (orbitingElementRef.current) {
                orbitingElementRef.current.style.transform = 'rotate(0deg)';
            }
            return;
        }

        const animate = () => {
            // This frequency must match the one in PlayerContext for perfect synchronization.
            const pannerFrequency = 0.2; // ~5 second rotation
            // Calculate angle based on the audio context's own clock.
            // This ensures the visual animation stays perfectly in sync with the audio
            // effect, even if the tab is in the background.
            const angleDegrees = (audioContext.currentTime * pannerFrequency * 360) % 360;
            
            if (orbitingElementRef.current) {
                orbitingElementRef.current.style.transform = `rotate(${angleDegrees}deg)`;
            }
            animationFrameRef.current = requestAnimationFrame(animate);
        };
        animate();
        
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isEnabled, audioContext]);

    return (
      <svg viewBox="0 0 112 112" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <circle 
            cx="56" 
            cy="56" 
            r="40" 
            stroke={isEnabled ? '#fc4b08' : '#6b7280'} 
            strokeOpacity="0.3"
            strokeWidth="2" 
            strokeDasharray="4 4"
            className="transition-all duration-500"
        />
        
        <g 
            ref={orbitingElementRef}
            style={{ transformOrigin: '56px 56px', willChange: 'transform' }}
        >
            <g 
                transform="translate(16 56)"
                className={`transition-opacity duration-500 ${isEnabled ? 'opacity-100' : 'opacity-0'}`}
                style={{ filter: 'drop-shadow(0 0 6px #fc4b08)' }}
            >
                <circle
                    cx="0"
                    cy="0"
                    r="6"
                    fill="#fc4b08"
                    style={{
                        animation: isEnabled ? 'pulse-8d 2s infinite ease-in-out' : 'none',
                        transformOrigin: 'center',
                        transformBox: 'fill-box'
                    }}
                />
            </g>
        </g>
        
        <g className={`transition-opacity duration-500 ${isEnabled ? 'opacity-100' : 'opacity-70'}`}>
          <circle cx="56" cy="48" r="14" fill={isEnabled ? '#d1d5db' : '#9ca3af'} className="transition-colors duration-500"/>
          <path d="M42 62 C 42 72, 70 72, 70 62 L 70 60 Q 70 52, 64 52 L 48 52 Q 42 52, 42 60 Z" fill={isEnabled ? '#d1d5db' : '#9ca3af'} className="transition-colors duration-500" />
        </g>
      </svg>
    );
  };


const AudioEffectsSection: React.FC = () => {
    const { eqSettings, setEqGain, resetEq, isEqEnabled, toggleEq, is8DEnabled, toggle8D, isReverbEnabled, toggleReverb, reverbMix, setReverbMix } = useContext(PlayerContext);
    const reverbSliderRef = useRef<HTMLInputElement>(null);
    const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);
    const presetMenuRef = useRef<HTMLDivElement>(null);

    const eqBands = [60, 230, 910, 3600, 14000];
    const presets = {
        'Flat': [0, 0, 0, 0, 0],
        'Pop': [-1, 4, 5, 2, -2],
        'Rock': [5, 2, -4, 1, 4],
        'Jazz': [4, 1, -2, 2, 3],
        'Vocal Boost': [-2, -1, 3, 2, -1],
    };

    const applyPreset = (name: keyof typeof presets) => {
        presets[name].forEach((gain, i) => setEqGain(i, gain));
    };

    useEffect(() => {
        if (reverbSliderRef.current) {
            reverbSliderRef.current.style.setProperty('--reverb-progress', `${reverbMix * 100}%`);
        }
    }, [reverbMix]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (presetMenuRef.current && !presetMenuRef.current.contains(event.target as Node)) {
            setIsPresetMenuOpen(false);
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
    );

    return (
        <Section title="Audio Effects" description="Customize your listening experience with an equalizer, spatial audio, and reverb. Changes apply in real-time.">
            <div className="space-y-12">
                {/* Equalizer */}
                <div className="space-y-6">
                    <ToggleSwitch label="Enable Equalizer" enabled={isEqEnabled} onChange={toggleEq} />
                    <div className={`transition-opacity duration-300 ${isEqEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                        <div className="flex justify-around items-center h-56 bg-black/20 p-4 rounded-lg">
                            {eqSettings.map((band, i) => (
                                <div key={i} className="flex flex-col items-center h-full w-16">
                                    <div className="flex-1 flex flex-col items-center justify-between w-full">
                                        <span className="text-xs font-bold text-white/80">+12</span>
                                        <div className="eq-slider-container relative">
                                             <span
                                                className="absolute text-sm font-semibold text-[#fc4b08] tabular-nums pointer-events-none ml-2"
                                                style={{
                                                    left: '100%',
                                                    top: `${50 - (band.gain / 12) * 50}%`,
                                                    transform: 'translateY(-50%)',
                                                }}
                                            >
                                                {band.gain > 0 ? '+' : ''}{band.gain}
                                            </span>
                                            <input type="range" min="-12" max="12" step="1" value={band.gain} onChange={(e) => setEqGain(i, Number(e.target.value))} className="eq-slider" />
                                        </div>
                                        <span className="text-xs font-bold text-white/80">-12</span>
                                    </div>
                                    <div className="mt-2 text-center">
                                        <span className="text-xs text-gray-400 mt-1">
                                            {eqBands[i] >= 1000 ? `${eqBands[i]/1000}` : eqBands[i]}
                                            <span className="text-gray-500">{eqBands[i] >= 1000 ? 'k' : ''}Hz</span>
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex items-center justify-between">
                            <div className="relative" ref={presetMenuRef}>
                                <button
                                    onClick={() => setIsPresetMenuOpen(p => !p)}
                                    className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-md text-sm text-gray-300 hover:bg-white/20 hover:text-white transition-colors"
                                >
                                    <span>Presets</span>
                                    <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isPresetMenuOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isPresetMenuOpen && (
                                    <div className="absolute bottom-full left-0 mb-2 w-40 bg-[#282828] border border-white/10 rounded-lg shadow-2xl p-2 z-10 origin-bottom-left animate-in fade-in slide-in-from-bottom-2 duration-200">
                                        {Object.keys(presets).map(name => (
                                            <button 
                                                key={name} 
                                                onClick={() => { applyPreset(name as keyof typeof presets); setIsPresetMenuOpen(false); }}
                                                className="w-full text-left px-3 py-2 text-sm rounded-md text-gray-300 hover:bg-white/10"
                                            >
                                                {name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button onClick={resetEq} className="px-4 py-2 text-sm bg-white/10 rounded-md hover:bg-white/20 transition-colors">Reset</button>
                        </div>
                    </div>
                </div>

                {/* Reverb */}
                <div className="border-t border-white/10 pt-8">
                    <ToggleSwitch label="Enable Reverb" enabled={isReverbEnabled} onChange={toggleReverb} />
                    <div className={`mt-4 space-y-2 transition-opacity duration-300 ${isReverbEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                         <label htmlFor="reverb-mix" className="text-sm text-gray-400">Wetness</label>
                         <input ref={reverbSliderRef} id="reverb-mix" type="range" min="0" max="1" step="0.01" value={reverbMix} onChange={(e) => setReverbMix(parseFloat(e.target.value))} className="reverb-slider" />
                    </div>
                </div>

                {/* 8D Audio */}
                <div className="border-t border-white/10 pt-8">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                         <div className="flex-shrink-0 w-28 h-28">
                            <Audio8DIcon isEnabled={is8DEnabled} />
                        </div>
                        <div className="w-full">
                            <ToggleSwitch label="Enable 8D Audio" enabled={is8DEnabled} onChange={toggle8D} />
                            <p className="text-xs text-gray-500 mt-2">Experience immersive sound that moves around you. Best with headphones.</p>
                        </div>
                    </div>
                </div>
            </div>
        </Section>
    );
};

const AboutSection: React.FC = () => {
    const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
    );

    return (
        <Section title="About MeMusic" description="Information about the project and its technologies.">
            <div className="text-gray-300 space-y-4 text-sm">
                <p><span className="font-bold text-white">Version:</span> 1.0.0</p>
                <p>This music player is a personal project designed to demonstrate modern web technologies and provide a seamless, account-free music listening experience.</p>
                <p>All music data is sourced from the unofficial <a href="https://github.com/sumitkolhe/jiosaavn-api" target="_blank" rel="noopener noreferrer" className="text-[#fc4b08] hover:underline">JioSaavn API</a>. All rights to the music belong to their respective owners.</p>
                
                <div className="pt-4 text-center">
                    <p className="font-bold text-white">Source Code & Credits</p>
                    <a href="https://github.com/ewkekw/memusic-webplayer" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-2 text-[#fc4b08] hover:underline">
                        <GithubIcon className="w-5 h-5" />
                        <span className="font-semibold">ewkekw/memusic-webplayer</span>
                    </a>
                </div>

                <div className="pt-4">
                  <p className="font-bold text-white">Powered by:</p>
                  <ul className="list-disc list-inside space-y-1 mt-1">
                      <li>React & TypeScript</li>
                      <li>TailwindCSS</li>
                      <li>Web Audio API</li>
                  </ul>
                </div>
            </div>
        </Section>
    );
};


const Settings: React.FC = () => {
  return (
    <div className="p-4 md:p-8 text-white space-y-12 max-w-5xl mx-auto">
        <h1 className="text-4xl font-black tracking-tight text-white">Settings</h1>
      <AudioEffectsSection />
      <ImportExportSection />
      <AboutSection />
    </div>
  );
};

export default Settings;
