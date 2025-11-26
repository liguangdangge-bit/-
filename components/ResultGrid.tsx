import React, { useState } from 'react';
import { Download, Sparkles, Grid as GridIcon, Square, CheckSquare, Check, Loader2 } from 'lucide-react';
import { StickerData } from '../types';
import JSZip from 'jszip';

interface ResultGridProps {
  stickers: StickerData[];
}

type BgMode = 'transparent' | 'white';

export const ResultGrid: React.FC<ResultGridProps> = ({ stickers }) => {
  const [bgMode, setBgMode] = useState<BgMode>('transparent');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isZipping, setIsZipping] = useState(false);

  // Initialize selection when stickers change (optional: default select all or none)
  // Currently defaults to none, user selects what they want.

  if (stickers.length === 0) return null;

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === stickers.length) {
      setSelectedIds(new Set()); // Deselect all
    } else {
      setSelectedIds(new Set(stickers.map(s => s.id)));
    }
  };

  const downloadSelected = async () => {
    if (selectedIds.size === 0) return;

    try {
      setIsZipping(true);
      const zip = new JSZip();
      const folder = zip.folder("stickers");

      stickers.forEach((sticker, index) => {
        if (selectedIds.has(sticker.id)) {
          // sticker.url is a data URL (data:image/png;base64,....)
          const base64Data = sticker.url.split(',')[1];
          const fileName = sticker.box.label 
            ? `${sticker.box.label.replace(/[^a-z0-9]/gi, '_')}_${index + 1}.png` 
            : `sticker_${index + 1}.png`;
          
          folder?.file(fileName, base64Data, { base64: true });
        }
      });

      const content = await zip.generateAsync({ type: "blob" });
      
      // Create download link
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = "stickers_pack.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error zipping files:", error);
      alert("Failed to create zip file.");
    } finally {
      setIsZipping(false);
    }
  };

  const allSelected = stickers.length > 0 && selectedIds.size === stickers.length;

  return (
    <div className="w-full max-w-6xl mx-auto mt-12 animate-fade-in-up pb-20">
      
      {/* Sticky Header for Actions */}
      <div className="sticky top-4 z-20 bg-white/90 backdrop-blur-md shadow-sm border border-gray-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="text-yellow-400 w-5 h-5" />
            <span>Result ({stickers.length})</span>
          </h2>
          
          <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>

          <div className="flex items-center space-x-2">
             <button 
               onClick={selectAll}
               className="text-sm font-semibold text-gray-600 hover:text-brand-500 flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
             >
               {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
               {allSelected ? 'Deselect All' : 'Select All'}
             </button>
             <span className="text-sm text-gray-400">
               {selectedIds.size} selected
             </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
           {/* Background Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setBgMode('transparent')}
              className={`p-1.5 rounded-md transition-all ${bgMode === 'transparent' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
              title="Transparent Background"
            >
              <GridIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setBgMode('white')}
              className={`p-1.5 rounded-md transition-all ${bgMode === 'white' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
              title="White Background"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={downloadSelected}
            disabled={selectedIds.size === 0 || isZipping}
            className={`
              flex items-center space-x-2 px-5 py-2 rounded-xl text-sm font-bold text-white shadow-lg transition-all transform active:scale-95
              ${selectedIds.size > 0 
                ? 'bg-brand-500 hover:bg-brand-600 hover:shadow-brand-200' 
                : 'bg-gray-300 cursor-not-allowed'
              }
            `}
          >
            {isZipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isZipping ? 'Zipping...' : 'Download Selected'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 p-4">
        {stickers.map((sticker, idx) => {
          const isSelected = selectedIds.has(sticker.id);
          
          return (
            <div 
              key={sticker.id}
              onClick={() => toggleSelection(sticker.id)}
              className={`
                group relative rounded-2xl p-4 shadow-sm transition-all duration-200 cursor-pointer flex flex-col items-center justify-between h-48 sm:h-56
                ${isSelected 
                  ? 'bg-brand-50 ring-2 ring-brand-500 shadow-md transform scale-[1.02]' 
                  : 'bg-white border border-gray-100 hover:shadow-lg hover:-translate-y-1'
                }
              `}
            >
              {/* Checkbox Overlay */}
              <div className="absolute top-3 left-3 z-10">
                <div className={`
                  w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all
                  ${isSelected ? 'bg-brand-500 border-brand-500' : 'bg-white/80 border-gray-300 group-hover:border-brand-300'}
                `}>
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
              </div>

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
                   className="max-w-full max-h-full object-contain drop-shadow-md select-none pointer-events-none"
                 />
              </div>
              
              <div className="mt-3 w-full text-center">
                <p className={`text-xs font-semibold truncate w-full ${isSelected ? 'text-brand-600' : 'text-gray-400'}`}>
                  {sticker.box.label || `Sticker #${idx + 1}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};