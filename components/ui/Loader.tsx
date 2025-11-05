import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex justify-center items-center p-8">
      <div className="w-12 h-12 border-4 border-[#fc4b08] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};