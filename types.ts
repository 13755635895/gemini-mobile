export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  ERROR = 'error'
}

export interface Attachment {
  mimeType: string;
  data: string; // Base64
}

export interface Message {
  id: string;
  role: Role;
  type: MessageType;
  content: string;
  timestamp: number;
  attachment?: Attachment;
  isStreaming?: boolean;
}

export enum GeminiModel {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview',
  IMAGE_GEN = 'gemini-2.5-flash-image' 
}