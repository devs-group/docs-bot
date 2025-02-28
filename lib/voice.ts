import axios from "axios";
import { VoiceContent } from "@/types/chatbot";
import { db } from "@/db";
import { voices } from "@/db/schema";
import { eq } from "drizzle-orm";

// Function to get all voice content for a user
export async function getUserVoiceContent(userId: string): Promise<VoiceContent[]> {
  try {
    const result = await db.select().from(voices).where(eq(voices.userId, userId));
    return result as unknown as VoiceContent[];
  } catch (error) {
    console.error("Error fetching user voice content:", error);
    throw new Error("Failed to fetch voice content");
  }
}

// Function to get a specific voice content by ID
export async function getVoiceContentById(id: string): Promise<VoiceContent | null> {
  try {
    const result = await db.select().from(voices).where(eq(voices.id, id));
    if (result.length === 0) return null;
    return result[0] as unknown as VoiceContent;
  } catch (error) {
    console.error("Error fetching voice content:", error);
    throw new Error("Failed to fetch voice content");
  }
}

// Function to delete voice content
export async function deleteVoiceContent(id: string): Promise<void> {
  try {
    await db.delete(voices).where(eq(voices.id, id));
  } catch (error) {
    console.error("Error deleting voice content:", error);
    throw new Error("Failed to delete voice content");
  }
}

// Function to regenerate audio for existing content
export async function regenerateAudio(
  content: string, 
  voiceId: string
): Promise<string> {
  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text: content,
        model_id: "eleven_turbo_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
        },
        responseType: "arraybuffer",
      }
    );

    // Convert the audio buffer to base64
    const audioBuffer = Buffer.from(response.data);
    const base64Audio = audioBuffer.toString("base64");
    
    // Create a data URL for the audio
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
    
    return audioUrl;
  } catch (error) {
    console.error("Error regenerating audio with ElevenLabs:", error);
    throw new Error("Failed to regenerate audio");
  }
}
