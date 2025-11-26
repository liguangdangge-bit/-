import React, { useState } from 'react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { ResultGrid } from './components/ResultGrid';
import { detectStickersByScan, cropStickers, fileToBase64 } from './utils/imageUtils';
import { AppState, StickerData } from './types';
import { AlertCircle, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [stickers, setStickers] = useState<StickerData[]>([]);
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    try {
      setAppState(AppState.PROCESSING);
      setErrorMsg(null);
      setStickers([]);

      // 1. Prepare Image
      const base64 = await fileToBase64(file);
      const dataUrl = `data:${file.type};base64,${base64}`;
      setOriginalImageSrc(dataUrl);

      // 2. Detect Bounding Boxes & Background Color
      const result = await detectStickersByScan(base64, file.type);
      const { boxes, bgColor } = result;

      if (!boxes || boxes.length === 0) {
        throw new Error("No stickers detected. Try an image with a clear background.");
      }

      // 3. Crop Images AND Remove Background
      // We pass the detected bgColor to perform color keying (making detected bg transparent)
      const croppedStickers = await cropStickers(dataUrl, boxes, bgColor);
      
      setStickers(croppedStickers);
      setAppState(AppState.SUCCESS);

    } catch (error: any) {
      console.error(error);
      setAppState(AppState.ERROR);
      setErrorMsg(error.message || "Something went wrong during processing.");
    }
  };

  const reset = () => {
    setAppState(AppState.IDLE);
    setStickers([]);
    setOriginalImageSrc(null);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen pb-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <Header />

        <div className="mt-8 flex flex-col items-center">
          
          {appState === AppState.IDLE || appState === AppState.PROCESSING ? (
             <UploadZone 
               onFileSelect={handleFileSelect} 
               isProcessing={appState === AppState.PROCESSING} 
             />
          ) : null}

          {appState === AppState.ERROR && (
            <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-lg">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-red-700">Oops!</h3>
              <p className="text-red-600 mb-4">{errorMsg}</p>
              <button 
                onClick={reset}
                className="bg-white border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors font-semibold"
              >
                Try Again
              </button>
            </div>
          )}

          {appState === AppState.SUCCESS && (
            <div className="w-full flex flex-col items-center">
              <div className="flex gap-4 mb-6">
                 <button 
                  onClick={reset}
                  className="flex items-center space-x-2 bg-white text-gray-600 px-6 py-2.5 rounded-full shadow-sm border border-gray-200 hover:border-brand-300 hover:text-brand-500 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Process Another</span>
                </button>
              </div>

              <ResultGrid stickers={stickers} />

              {originalImageSrc && (
                <div className="mt-16 w-full max-w-2xl opacity-50 hover:opacity-100 transition-opacity">
                   <p className="text-center text-xs text-gray-400 mb-2 uppercase tracking-widest font-bold">Original Reference</p>
                   <img src={originalImageSrc} alt="Original" className="w-full rounded-2xl shadow-inner border border-gray-200" />
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default App;