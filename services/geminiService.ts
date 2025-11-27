import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { GeminiModel, Attachment } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

// Initialize the client
// API Key is guaranteed to be in process.env.API_KEY per system instructions
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface GenerateParams {
  model: GeminiModel;
  prompt: string;
  attachment?: Attachment;
  history?: { role: string; parts: { text: string }[] }[];
}

export const streamGeminiResponse = async (
  { model, prompt, attachment, history }: GenerateParams,
  onChunk: (text: string) => void
): Promise<string> => {
  try {
    // If we have an image attachment (for vision tasks), we use generateContentStream directly
    // Note: 'gemini-2.5-flash-image' implies image generation in some contexts, but 'gemini-2.5-flash' handles vision.
    // If the user selected IMAGE_GEN, we handle that separately as a non-streaming generation task usually,
    // but for this unify function, let's assume text/vision chat.

    // If it is strictly an image generation request (prompt to image), handling is different.
    // For this chat app, we focus on Text/Vision -> Text.

    let fullText = "";

    if (attachment) {
      // Vision request
      const responseStream = await ai.models.generateContentStream({
        model: model === GeminiModel.IMAGE_GEN ? GeminiModel.FLASH : model, // Fallback to flash for vision if image gen selected mistakenly for input
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: attachment.mimeType,
                data: attachment.data,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });

      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          fullText += text;
          onChunk(text);
        }
      }
    } else {
      // Text-only chat
      // We use a chat session to maintain history context
      // Mapping our simple history to SDK format if needed, or just using generateContent with history context manually
      // For simplicity in this demo, we'll use a fresh chat session for each "turn" if history is provided, 
      // or just send the history as content. 
      
      // Ideally, we persist a `Chat` object in the App state, but stateless service is easier for React hot-reloading.
      // We will construct the chat using ai.chats.create with history.

      const chatHistory = history?.map(h => ({
        role: h.role,
        parts: h.parts
      })) || [];

      const chat: Chat = ai.chats.create({
        model: model,
        history: chatHistory,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });

      const responseStream = await chat.sendMessageStream({ message: prompt });

      for await (const chunk of responseStream) {
        const text = (chunk as GenerateContentResponse).text;
        if (text) {
          fullText += text;
          onChunk(text);
        }
      }
    }

    return fullText;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

// Separate function for Image Generation if we want to support "Draw me a cat"
export const generateImageContent = async (prompt: string): Promise<string> => {
    // Using the image generation model
    const response = await ai.models.generateContent({
        model: GeminiModel.IMAGE_GEN,
        contents: prompt,
        config: {
             // Basic config for image gen
        }
    });
    
    // Extract image from response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    return "";
};
