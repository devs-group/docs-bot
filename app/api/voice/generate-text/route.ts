import { NextRequest, NextResponse } from "next/server";
import { parseFormData } from "@/lib/upload";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ChatbotSource } from "@/types/chatbot";
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

// Function to extract text from PDFs
async function extractTextFromPDF(filePath: string): Promise<string> {
  const loader = new PDFLoader(filePath);
  const docs = await loader.load();
  return docs.map(doc => doc.pageContent).join(" ");
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
        { error: "No sources provided. Please provide either a PDF file or a URL." },
        { status: 400 },
      );
    }

    // Extract length parameter
    const length = fields.length ? parseInt(String(fields.length)) : 1; // Default to 1 minute
    
    // Extract custom prompt if provided
    const customPrompt = fields.customPrompt ? String(fields.customPrompt) : undefined;

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

    // Generate summary based on the desired length and custom prompt
    const summary = await generateSummary(combinedText, length, customPrompt);
    
    return NextResponse.json({
      summary,
      message: "Text summary generated successfully",
    });
  } catch (error) {
    console.error("Error generating text summary:", error);
    return NextResponse.json(
      { error: "Failed to generate text summary", details: error },
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
