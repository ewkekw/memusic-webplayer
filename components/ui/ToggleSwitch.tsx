
import React from 'react';

export const ToggleSwitch: React.FC<{label?: string, enabled: boolean, onChange: () => void}> = ({ label, enabled, onChange }) => (
    <div className="flex items-center justify-between w-full min-h-[2rem] select-none">
        {label && <span className="font-bold text-sm text-white mr-4 flex-1 cursor-pointer" onClick={onChange}>{label}</span>}
        <button
            onClick={onChange}
            className={`${enabled ? 'bg-[#fc4b08]' : 'bg-white/20'} relative inline-flex items-center h-7 rounded-full w-12 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#121212] focus:ring-[#fc4b08] flex-shrink-0`}
        >
            <span className={`${enabled ? 'translate-x-6' : 'translate-x-1'} inline-block w-5 h-5 transform bg-white rounded-full transition-transform shadow-md`} />
        </button>
    </div>
);
