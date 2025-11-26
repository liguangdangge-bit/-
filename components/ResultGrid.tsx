import React, { useState } from 'react';
import { Download, Sparkles, Grid as GridIcon, Square } from 'lucide-react';
import { StickerData } from '../types';

interface ResultGridProps {
  stickers: StickerData[];
}

type BgMode = 'transparent' | 'white';

export const ResultGrid: React.FC<ResultGridProps> = ({ stickers }) => {
  const [bgMode, setBgMode] = useState<BgMode>('transparent');

  if (stickers.length === 0) return null;

  return (
    <div className="w-full max-w-6xl mx-auto mt-12 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 px-4 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Sparkles className="text-yellow-400 w-6 h-6" />
          <span>Found {stickers.length} Stickers</span>
        </h2>

        {/* Background Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setBgMode('transparent')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              bgMode === 'transparent' 
                ? 'bg-white text-gray-800 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <GridIcon className="w-4 h-4" />
            <span>Transparent</span>
          </button>
          <button
            onClick={() => setBgMode('white')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              bgMode === 'white' 
                ? 'bg-white text-gray-800 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Square className="w-4 h-4" />
            <span>White</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 p-4">
        {stickers.map((sticker, idx) => (
          <div 
            key={sticker.id}
            className="group relative bg-white rounded-2xl p-4 shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 flex flex-col items-center justify-between h-48 sm:h-56"
          >
            {/* Dynamic Background Container */}
            <div 
              className={`
                w-full h-full flex items-center justify-center relative overflow-hidden rounded-xl transition-all duration-300
                ${bgMode === 'transparent' 
                   ? "bg-[url('https://res.cloudinary.com/practicaldev/image/fetch/s--n-NqS83R--/c_limit%2Cf_auto%2Cfl_progressive%2Cq_auto%2Cw_880/https://dev-to-uploads.s3.amazonaws.com/uploads/articles/036s379mh98485295550.png')] bg-repeat bg-[length:10px_10px]" 
                   : "bg-white border border-gray-100"
                }
              `}
            >
               <img 
                 src={sticker.url} 
                 alt={`Sticker ${idx}`} 
                 className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-md"
               />
            </div>
            
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <a 
                href={sticker.url} 
                download={`sticker_${idx + 1}.png`}
                className="bg-brand-500 hover:bg-brand-600 text-white p-2 rounded-full shadow-lg flex items-center justify-center transform active:scale-95 transition-all"
                title="Download Sticker (PNG)"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>

            <div className="mt-3 w-full text-center">
              <p className="text-xs font-semibold text-gray-400 truncate w-full">
                {sticker.box.label || `Sticker #${idx + 1}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};