import { GoogleGenAI, Type } from "@google/genai";
import { BoundingBox } from '../types';

export const detectStickers = async (base64Image: string, mimeType: string): Promise<BoundingBox[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Analyze this image which contains a collection of stickers or emojis. 
      Detect the bounding box for EACH individual sticker/character.
      Return the coordinates normalized (0 to 1).
      Be precise. Do not merge separate stickers into one box.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of bounding boxes for each detected sticker",
          items: {
            type: Type.OBJECT,
            properties: {
              ymin: { type: Type.NUMBER, description: "Top Y coordinate (0-1)" },
              xmin: { type: Type.NUMBER, description: "Left X coordinate (0-1)" },
              ymax: { type: Type.NUMBER, description: "Bottom Y coordinate (0-1)" },
              xmax: { type: Type.NUMBER, description: "Right X coordinate (0-1)" },
              label: { type: Type.STRING, description: "A short label describing the sticker (e.g., 'happy girl', 'cat')" }
            },
            required: ["ymin", "xmin", "ymax", "xmax"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini");
    }

    const boxes = JSON.parse(text) as BoundingBox[];
    return boxes;

  } catch (error) {
    console.error("Gemini Detection Error:", error);
    throw error;
  }
};
