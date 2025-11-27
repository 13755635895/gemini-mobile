import { GeminiModel } from './types';

export const DEFAULT_MODEL = GeminiModel.FLASH;

export const MODEL_LABELS: Record<GeminiModel, string> = {
  [GeminiModel.FLASH]: 'Gemini 2.5 Flash',
  [GeminiModel.PRO]: 'Gemini 3.0 Pro',
  [GeminiModel.IMAGE_GEN]: 'Imagen (via Flash)'
};

export const SYSTEM_INSTRUCTION = `You are a helpful, clever, and friendly AI assistant named Gemini. 
You provide clear, concise, and accurate information. 
When asked to write code, provide it in markdown code blocks. 
If the user sends an image, analyze it in detail.`;
