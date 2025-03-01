import { NextRequest, NextResponse } from "next/server";
import { parseFormData } from "@/lib/upload";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ChatbotSource } from "@/types/chatbot";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { ChatOpenAI } from "@langchain/openai";
import * as fs from 'fs/promises';
import * as path from 'path';

// Helper function to normalize URLs
function normalizeUrl(url: string): string {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
}

// Function to extract text from PDFs
async function extractTextFromPDF(filePath: string): Promise<string> {
  const loader = new PDFLoader(filePath);
  const docs = await loader.load();
  return docs.map(doc => doc.pageContent).join(" ");
}

// Function to extract text from text-based files (markdown, txt, json)
async function extractTextFromFile(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw new Error(`Failed to read file: ${filePath}`);
  }
}

// Function to extract text from URLs
async function extractTextFromURL(url: string): Promise<string> {
  const loader = new CheerioWebBaseLoader(url);
  const docs = await loader.load();
  return docs.map(doc => doc.pageContent).join(" ");
}

// Function to generate a summary of the content
async function generateSummary(text: string, lengthInMinutes: number, customPrompt?: string): Promise<string> {
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
  
  const prompt = `${customPrompt}\n\nTarget length: ${targetWordCount} words (about ${lengthInMinutes} minute(s) when spoken)\n\nContent to summarize:\n${chunks.slice(0, 5).join("\n\n")}`
  
  const response = await model.invoke(prompt);
  // Extract the text content from the AIMessageChunk
  return response.content.toString();
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

    // Check for direct text input
    const directText = fields.directText;
    if (directText && typeof directText === 'string' && directText.trim()) {
      // If direct text is provided, use it directly
      const length = parseInt(fields.length as string) || 1;
      const customPrompt = fields.customPrompt as string || undefined;
      
      const summary = await generateSummary(directText, length, customPrompt);
      
      return NextResponse.json({ summary });
    }

    // Process files
    if (files) {
      for (const file of files) {
        const extension = path.extname(file.name).toLowerCase();
        
        if (extension === '.pdf') {
          sources.push({
            type: "pdf",
            path: file.path,
          });
        } else if (['.md', '.markdown', '.txt', '.json'].includes(extension)) {
          sources.push({
            type: extension.substring(1), // Remove the dot
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
        { error: "No sources provided. Please provide either a file, URL, or direct text." },
        { status: 400 },
      );
    }

    // Extract text from all sources
    let combinedText = "";
    
    for (const source of sources) {
      try {
        let extractedText = "";
        
        if (source.type === "pdf") {
          extractedText = await extractTextFromPDF(source.path);
        } else if (source.type === "url") {
          extractedText = await extractTextFromURL(source.path);
        } else if (["md", "markdown", "txt", "json"].includes(source.type)) {
          extractedText = await extractTextFromFile(source.path);
        }
        
        combinedText += extractedText + "\n\n";
      } catch (error) {
        console.error(`Error processing source ${source.path}:`, error);
      }
    }
    
    if (!combinedText.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from any of the provided sources." },
        { status: 400 },
      );
    }

    // Generate summary
    const length = parseInt(fields.length as string) || 1;
    const customPrompt = fields.customPrompt as string || undefined;
    
    const summary = await generateSummary(combinedText, length, customPrompt);
    
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error generating text summary:", error);
    return NextResponse.json(
      { error: "Failed to generate text summary" },
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
