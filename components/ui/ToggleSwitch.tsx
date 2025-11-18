
import React from 'react';

export const ToggleSwitch: React.FC<{label?: string, enabled: boolean, onChange: () => void}> = ({ label, enabled, onChange }) => (
    <div className="flex items-center justify-between">
        {label && <span className="font-medium text-white">{label}</span>}
        <button
            onClick={onChange}
            className={`${enabled ? 'bg-[#fc4b08]' : 'bg-gray-600'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#282828] focus:ring-[#fc4b08]`}
        >
            <span className={`${enabled ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} />
        </button>
    </div>
);
