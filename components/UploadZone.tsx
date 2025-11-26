import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Loader2 } from 'lucide-react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, isProcessing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcess(e.target.files[0]);
    }
  };

  const validateAndProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    onFileSelect(file);
  };

  return (
    <div
      onClick={() => !isProcessing && fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative w-full max-w-2xl mx-auto h-64 border-4 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group
        ${isProcessing ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-80' : 
          isDragging ? 'border-brand-500 bg-brand-50 scale-[1.02]' : 'border-gray-300 bg-white hover:border-brand-300 hover:bg-gray-50'}
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        accept="image/*"
        className="hidden"
        disabled={isProcessing}
      />

      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none rounded-3xl" />

      {isProcessing ? (
        <div className="flex flex-col items-center space-y-4 animate-pulse">
          <Loader2 className="w-16 h-16 text-brand-500 animate-spin" />
          <div className="text-center">
            <p className="text-xl font-bold text-gray-700">Scanning Image...</p>
            <p className="text-sm text-gray-500">Detecting sticker boundaries</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4 z-10 p-6 text-center">
          <div className={`p-4 rounded-full transition-colors duration-300 ${isDragging ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-500'}`}>
            {isDragging ? <ImageIcon className="w-12 h-12" /> : <UploadCloud className="w-12 h-12" />}
          </div>
          <div className="space-y-1">
            <p className="text-xl font-bold text-gray-700">
              {isDragging ? 'Drop it like it\'s hot!' : 'Click or Drag image here'}
            </p>
            <p className="text-sm text-gray-400">
              Supports JPG, PNG, WEBP
            </p>
          </div>
        </div>
      )}
    </div>
  );
};