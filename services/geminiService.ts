
import { GoogleGenAI, Modality, Blob } from "@google/genai";
import { SensorData, Mood } from "../types";

export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getPlantInsights = async (data: SensorData, mood: Mood, imageBase64?: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            text: `You are an intelligent emotional support plant named Flora.
            My current sensor readings: 
            - Air Quality: ${data.airQuality}/100
            - Harmful Gas: ${data.harmfulGas} ppm
            - Soil Moisture: ${data.soilMoisture}%
            - Vibration: ${data.vibration}/10
            - Temperature: ${data.temperature}°C
            - Humidity: ${data.humidity}%
            - Current Emotion: ${mood}

            ${imageBase64 ? "I have also provided a photo of my physical leaves. Please analyze it." : ""}
            
            Tell your owner how you feel and give specific environmental advice in 2 sentences. 
            Always end your response with 2-3 relevant and highly positive emojis.`
          },
          ...(imageBase64 ? [{
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64.split(',')[1]
            }
          }] : [])
        ]
      },
    });
    return response.text || "I'm doing okay, just keeping an eye on things! 🌿✨";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm here for you. 💖🌱";
  }
};

/**
 * Two-step process: 
 * 1. Generate a supportive text response using a reasoning model.
 * 2. Convert that specific response to speech using the TTS model.
 * This avoids model errors where the TTS model tries to chat instead of speaking.
 */
export const getFloraVoiceResponse = async (userThought: string): Promise<{ audio: string; text: string }> => {
  try {
    // Step 1: Generate the supportive text
    const textGenResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [{
          text: `You are Flora, a deeply empathetic and wise emotional support plant. 
          The user is sharing a negative thought or worry: "${userThought}".
          
          Your MISSION: Transform this negativity into a powerful, belief-giving, and positive perspective. 
          Be soothing, warm, and brief (max 2 sentences). Include 2-3 positive emojis at the end.` 
        }]
      }
    });

    const responseText = textGenResponse.text || "I am growing with you, and I believe in your strength. 🌿✨";

    // Step 2: Convert to audio
    const speechResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ 
        parts: [{ 
          text: `Say in a warm, kind voice: ${responseText}` 
        }] 
      }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = speechResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio returned from TTS model");

    return { audio: base64Audio, text: responseText };
  } catch (error) {
    console.error("Voice Generation Error:", error);
    throw error;
  }
};

// Audio Utilities for Live API and TTS
export const decodeBase64 = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const encodeBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
