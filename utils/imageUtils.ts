import { BoundingBox, StickerData } from '../types';

interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface DetectionResult {
  boxes: BoundingBox[];
  bgColor: RGBA;
}

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
};

export const detectStickersByScan = async (base64: string, mimeType: string): Promise<DetectionResult> => {
  const img = await loadImage(`data:${mimeType};base64,${base64}`);
  
  const canvas = document.createElement('canvas');
  // Process at a reasonable resolution to ensure performance while maintaining accuracy
  const MAX_DIM = 2048;
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  let scale = 1;
  
  if (w > MAX_DIM || h > MAX_DIM) {
    scale = Math.min(MAX_DIM / w, MAX_DIM / h);
    w = Math.floor(w * scale);
    h = Math.floor(h * scale);
  }
  
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas context failed");
  
  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  
  // 1. Detect Background Color (sample corners)
  const getPixel = (x: number, y: number): RGBA => {
    const i = (y * w + x) * 4;
    return { r: data[i], g: data[i+1], b: data[i+2], a: data[i+3] };
  };

  const corners = [
    getPixel(0, 0),
    getPixel(w - 1, 0),
    getPixel(0, h - 1),
    getPixel(w - 1, h - 1)
  ];

  // Simple heuristic: Use top-left. Most sticker sheets have uniform background.
  const bg = corners[0];
  const isTransparentBg = bg.a < 20;

  // 2. Helper to check if a pixel is background
  const THRESHOLD = 35; // Color distance threshold
  
  const isBackground = (idx: number) => {
    const r = data[idx];
    const g = data[idx+1];
    const b = data[idx+2];
    const a = data[idx+3];

    if (isTransparentBg) return a < 20;
    if (a < 20) return true; // Treat existing transparent pixels as background

    const dist = Math.abs(r - bg.r) + Math.abs(g - bg.g) + Math.abs(b - bg.b);
    return dist < THRESHOLD;
  };

  const visited = new Uint8Array(w * h);
  const boxes: BoundingBox[] = [];
  
  // 3. Scan and Flood Fill
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      
      if (visited[idx]) continue;
      
      // Check if this pixel is background
      if (isBackground(idx * 4)) {
        visited[idx] = 1;
        continue;
      }

      // Found a new object! Start Flood Fill
      let minX = x, maxX = x, minY = y, maxY = y;
      const stack = [idx];
      visited[idx] = 1;
      let pixelCount = 0;

      while (stack.length > 0) {
        const curr = stack.pop()!;
        const cx = curr % w;
        const cy = Math.floor(curr / w);
        pixelCount++;

        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        // Neighbors (4-way)
        const neighbors = [curr - 1, curr + 1, curr - w, curr + w];
        
        for (const n of neighbors) {
          // Boundary checks
          if (n < 0 || n >= w * h) continue;
          if (n === curr - 1 && cx === 0) continue;
          if (n === curr + 1 && cx === w - 1) continue;

          if (!visited[n]) {
             if (!isBackground(n * 4)) {
               visited[n] = 1;
               stack.push(n);
             }
          }
        }
      }

      // 4. Validate Object
      // Filter noise: must be at least 15x15 px (scaled) and have some density
      if ((maxX - minX) > 10 && (maxY - minY) > 10 && pixelCount > 50) {
         boxes.push({
           xmin: minX / w,
           ymin: minY / h,
           xmax: (maxX + 1) / w,
           ymax: (maxY + 1) / h,
           label: `Sticker`
         });
      }
    }
  }

  return { boxes, bgColor: bg };
};

export const cropStickers = async (
  imageSrc: string,
  boxes: BoundingBox[],
  removeBgColor?: RGBA
): Promise<StickerData[]> => {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) throw new Error("Could not get canvas context");

  const stickers: StickerData[] = [];
  const PADDING = 0.01; 

  // Threshold for background removal during crop
  const BG_REMOVE_THRESHOLD = 45;

  boxes.forEach((box, index) => {
    // Calculate pixel coordinates with slight padding
    const ymin = Math.max(0, box.ymin - PADDING);
    const xmin = Math.max(0, box.xmin - PADDING);
    const ymax = Math.min(1, box.ymax + PADDING);
    const xmax = Math.min(1, box.xmax + PADDING);

    const pixelX = Math.floor(xmin * img.naturalWidth);
    const pixelY = Math.floor(ymin * img.naturalHeight);
    const pixelWidth = Math.floor((xmax - xmin) * img.naturalWidth);
    const pixelHeight = Math.floor((ymax - ymin) * img.naturalHeight);

    if (pixelWidth <= 0 || pixelHeight <= 0) return;

    // Set canvas size
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;

    // Clear and draw the cropped area
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      img,
      pixelX,
      pixelY,
      pixelWidth,
      pixelHeight,
      0,
      0,
      pixelWidth,
      pixelHeight
    );

    // BACKGROUND REMOVAL LOGIC
    if (removeBgColor) {
      const imageData = ctx.getImageData(0, 0, pixelWidth, pixelHeight);
      const data = imageData.data;
      const { r: br, g: bg, b: bb, a: ba } = removeBgColor;
      
      const isTransparentBgSource = ba < 20;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        const a = data[i+3];

        if (a < 10) continue; // Already transparent

        let isMatch = false;
        if (isTransparentBgSource) {
           // If source bg was transparent, we don't really need to do much unless we want to clean noise
           isMatch = false; 
        } else {
           const dist = Math.abs(r - br) + Math.abs(g - bg) + Math.abs(b - bb);
           if (dist < BG_REMOVE_THRESHOLD) {
             isMatch = true;
           }
        }

        if (isMatch) {
          data[i + 3] = 0; // Make transparent
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }

    const dataUrl = canvas.toDataURL('image/png');
    
    stickers.push({
      id: `sticker-${index}-${Date.now()}`,
      url: dataUrl,
      box: box
    });
  });

  return stickers;
};