import React from 'react';
import { Scissors, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <div className="w-full py-8 text-center flex flex-col items-center justify-center space-y-3">
      <div className="flex items-center space-x-3">
        <div className="bg-brand-500 p-3 rounded-2xl shadow-lg rotate-[-6deg]">
          <Scissors className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">
          Sticker<span className="text-brand-500">Split</span>
        </h1>
        <div className="bg-yellow-400 p-2 rounded-full shadow-md rotate-[12deg]">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-gray-500 font-medium max-w-md">
        Upload your sticker sheets. We'll automatically cut them out and <span className="text-brand-500 font-bold">remove the background</span> for you.
      </p>
    </div>
  );
};