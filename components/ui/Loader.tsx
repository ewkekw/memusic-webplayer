import React, { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex justify-center items-center p-8">
      <div className="w-12 h-12 border-4 border-[#fc4b08] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

// --- New Component ---
export interface TabItem<T extends string> {
  id: T;
  label: string;
}

interface AnimatedTabsProps<T extends string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onTabClick: Dispatch<SetStateAction<T>>;
}

export const AnimatedTabs = <T extends string>({ tabs, activeTab, onTabClick }: AnimatedTabsProps<T>) => {
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const [isReadyForTransition, setIsReadyForTransition] = useState(false);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeTabIndex = tabs.findIndex(tab => tab.id === activeTab);
    const activeTabElement = tabsRef.current[activeTabIndex];
    
    if (activeTabElement) {
      const { offsetLeft, offsetWidth } = activeTabElement;
      setSliderStyle({
        left: offsetLeft,
        width: offsetWidth,
        opacity: 1,
      });
    }

    // Delay enabling transitions to prevent animation on initial load, but only if an active tab is found.
    if (!isReadyForTransition && activeTabElement) {
        const timer = setTimeout(() => setIsReadyForTransition(true), 50);
        return () => clearTimeout(timer);
    }
  }, [activeTab, tabs, isReadyForTransition]);

  return (
    <div ref={containerRef} className="relative flex space-x-1 bg-white/5 p-1 rounded-full">
      <div
        aria-hidden="true"
        className="absolute h-[calc(100%-0.5rem)] top-1 bg-[#fc4b08] rounded-full shadow-md"
        style={{
          ...sliderStyle,
          transition: isReadyForTransition
            ? 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1), width 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
            : 'none',
        }}
      />
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          // FIX: The ref callback should not return a value. Wrapped in curly braces to ensure void return.
          ref={el => { tabsRef.current[index] = el; }}
          onClick={() => onTabClick(tab.id)}
          className={`relative z-10 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 focus:outline-none ${
            activeTab === tab.id ? 'text-black' : 'text-gray-300 hover:text-white'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
