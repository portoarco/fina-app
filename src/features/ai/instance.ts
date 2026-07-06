import { ENV } from "@/config/environment";
import { GoogleGenAI } from "@google/genai";

export function createAI() {
  if (!ENV.googleGenAIKey) {
    throw new Error("AI API Key is missing!");
  }
  const ai = new GoogleGenAI({ apiKey: ENV.googleGenAIKey });

  return ai;
}
