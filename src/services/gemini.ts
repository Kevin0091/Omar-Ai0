import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";
import { MessageAttachment } from "../types";

export function getGeminiModel() {
  // Using the user-provided API key from the chat
  const providedKey = "AIzaSyDJJ9YWZGlG8XHvs9JvFeVc4azZ3lusxlY";
  const envKey = process.env.GEMINI_API_KEY;
  const apiKey = providedKey || envKey;
  
  if (!apiKey) {
    console.error("Gemini API key is not defined.");
  }
  
  return new GoogleGenAI({ apiKey: apiKey });
}

export async function* streamChatWithGemini(
  history: { role: "user" | "model"; parts: any[] }[],
  prompt: string,
  attachments: MessageAttachment[] = []
): AsyncGenerator<string, void, unknown> {
  const ai = getGeminiModel();
  
  const contents = [...history];

  const parts: any[] = [];
  
  if (attachments && attachments.length > 0) {
    for (const a of attachments) {
      parts.push({
        inlineData: {
          mimeType: a.mimeType,
          data: a.data.includes("base64,") ? a.data.split("base64,")[1] : a.data,
        }
      });
    }
  }
  
  parts.push({ text: prompt });
  
  contents.push({ role: "user", parts });

  try {
    const response = await ai.models.generateContentStream({
      model: "gemini-2.5-flash", 
      contents: contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      }
    });

    for await (const chunk of response) {
      yield (chunk as GenerateContentResponse).text || "";
    }
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    throw new Error(err.message || "Failed to generate AI response.");
  }
}
