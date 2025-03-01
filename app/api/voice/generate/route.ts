import { NextRequest, NextResponse } from "next/server";
import { parseFormData } from "@/lib/upload";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { v4 as uuidv4 } from "uuid";
import { ChatbotSource } from "@/types/chatbot";
import { db } from "@/db";
import { voices } from "@/db/schema";
import axios from "axios";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { ChatOpenAI } from "@langchain/openai";

// Helper function to normalize URLs
function normalizeUrl(url: string): string {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
}

// Function to extract and summarize text from PDFs
async function extractTextFromPDF(filePath: string): Promise<string> {
  const loader = new PDFLoader(filePath);
  const docs = await loader.load();
  return docs.map(doc => doc.pageContent).join(" ");
}

// Function to extract and summarize text from URLs
async function extractTextFromURL(url: string): Promise<string> {
  const loader = new CheerioWebBaseLoader(url);
  const docs = await loader.load();
  return docs.map(doc => doc.pageContent).join(" ");
}

// Function to generate a summary of the content
async function generateSummary(text: string, lengthInMinutes: number): Promise<string> {
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 2000,
    chunkOverlap: 200,
  });
  
  const chunks = await textSplitter.splitText(text);
  
  // Calculate approximate word count for the target length
  // Average speaking rate is about 150 words per minute
  const targetWordCount = lengthInMinutes * 150;
  
  // Use OpenAI to generate a summary
  const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.5,
  });
  
  const prompt = `
  Create a conversational summary of the following content. The summary should:
  1. Be approximately ${targetWordCount} words (about ${lengthInMinutes} minute(s) when spoken)
  2. Be engaging and natural-sounding for text-to-speech
  3. Maintain a conversational tone as if explaining to a listener
  4. Cover the most important points from the content
  5. Include brief pauses and natural transitions and write always "we are ..." and in english
  
  Here's the content to summarize:
  ${chunks.slice(0, 5).join("\n\n")}
  `;
  
  const response = await model.invoke(prompt);
  // Extract the text content from the AIMessageChunk
  return response.content.toString();
}

// Function to generate audio using ElevenLabs API
async function generateAudio(text: string, voiceId: string): Promise<string> {
  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text,
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
    console.error("Error generating audio with ElevenLabs:", error);
    throw new Error("Failed to generate audio");
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const { fields, files } = await parseFormData(req);
    const sources: ChatbotSource[] = [];
    let summary = "";

    // Check if we have a pre-generated text summary
    if (fields.content && String(fields.content).trim()) {
      summary = String(fields.content);
    } else {
      // Process PDF files
      if (files) {
        for (const file of files) {
          if (file.name.toLowerCase().endsWith(".pdf")) {
            sources.push({
              type: "pdf",
              path: file.path,
            });
          }
        }
      }

      // Process URLs
      const urls = fields.urls;
      if (urls) {
        const urlsArray = Array.isArray(urls) ? urls : [urls];
        for (const url of urlsArray) {
          if (url.trim()) {
            sources.push({
              type: "url",
              path: normalizeUrl(url.trim()),
            });
          }
        }
      }

      if (sources.length === 0) {
        return NextResponse.json(
          { error: "No sources or content provided. Please provide either a PDF file, a URL, or pre-generated content." },
          { status: 400 },
        );
      }

      // Extract text from sources
      let combinedText = "";
      for (const source of sources) {
        if (source.type === "pdf") {
          const text = await extractTextFromPDF(source.path);
          combinedText += text + " ";
        } else if (source.type === "url") {
          const text = await extractTextFromURL(source.path);
          combinedText += text + " ";
        }
      }

      // Generate summary based on the desired length
      const length = fields.length ? parseInt(String(fields.length)) : 1; // Default to 1 minute
      summary = await generateSummary(combinedText, length);
    }

    // Extract other fields
    const name = fields.name ? String(fields.name) : "Voice Content";
    const voiceId = fields.voiceId ? String(fields.voiceId) : "21m00Tcm4TlvDq8ikWAM"; // Default to Rachel
    const length = fields.length ? parseInt(String(fields.length)) : 1; // Default to 1 minute
    
    // Generate audio using ElevenLabs
    const audioUrl = await generateAudio(summary, voiceId);
    
    // Generate a unique ID for the voice content
    const id = uuidv4();
    
    // Determine the source to store
    let sourceToStore: ChatbotSource;
    if (sources.length > 0) {
      sourceToStore = sources[0]; // Store the first source if available
    } else {
      // Create a placeholder source if we're using pre-generated content
      sourceToStore = {
        type: "text",
        path: "Pre-generated content",
      };
    }
    
    // Store in database
    await db.insert(voices).values({
      id,
      userId: session.user.id,
      name,
      content: summary,
      voiceId,
      audioUrl,
      length,
      source: sourceToStore,
    });

    return NextResponse.json({
      voiceId: id,
      audioUrl,
      message: "Voice content generated successfully",
    });
  } catch (error) {
    console.log(error)
    console.error("Error generating voice content:", error);
    return NextResponse.json(
      { error: "Failed to generate voice content", details: error },
      { status: 500 },
    );
  }
}

// Increase the default body size limit for file uploads
export const config = {
  api: {
    bodyParser: false, // Required for parseFormData
    responseLimit: "100mb",
  },
};
