import { NextRequest, NextResponse } from "next/server";
import { parseFormData } from "@/lib/upload";
import { createChatBot } from "@/lib/chatbot";
import { storeChatbot } from "@/lib/storage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust this path as needed
import { v4 as uuidv4 } from "uuid";
import { ChatbotSource } from "@/types/chatbot";
import * as fs from 'fs/promises';
import * as path from 'path';

// Helper function to normalize URLs
function normalizeUrl(url: string): string {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
}

// Function to save direct text input to a file
async function saveTextToFile(text: string): Promise<string> {
  const tempDir = path.join(process.cwd(), 'tmp');
  
  // Ensure the temp directory exists
  try {
    await fs.mkdir(tempDir, { recursive: true });
  } catch (error) {
    console.error("Error creating temp directory:", error);
  }
  
  const filePath = path.join(tempDir, `text_${Date.now()}.txt`);
  await fs.writeFile(filePath, text);
  return filePath;
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fields, files } = await parseFormData(req);
    const sources: ChatbotSource[] = [];

    // Check for direct text input
    const directText = fields.text;
    if (directText && typeof directText === 'string' && directText.trim()) {
      const filePath = await saveTextToFile(directText);
      sources.push({
        type: "text",
        path: filePath,
      });
    }
    
    // Process document files
    if (files && files.length > 0) {
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
        } else if (['.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt'].includes(extension)) {
          // For binary files, we'll just use a generic file type
          sources.push({
            type: "file",
            path: file.path,
          });
        }
      }
    }

    // Process URLs (key: "urls")
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
        { error: "No sources provided. Please provide either document files, URLs, or direct text." },
        { status: 400 },
      );
    }

    // Extract other fields
    const name = fields.name ? String(fields.name) : "";
    const modelName = fields.model ? String(fields.model) : "gpt-4o-mini";
    const customPrompt = fields.customPrompt
      ? String(fields.customPrompt)
      : undefined;

    const chatbotId = uuidv4();
    const chain = await createChatBot(sources, chatbotId, {
      modelName,
      customPrompt,
    });

    // Save configuration along with chatbot
    await storeChatbot(chatbotId, name, session.user.id, chain, sources, {
      modelName,
      customPrompt,
    });

    return NextResponse.json({
      chatbotId,
      message: "Chatbot initialized successfully",
    });
  } catch (error) {
    console.error("Error initializing chatbot:", error);
    
    // Provide a more informative error message
    let errorMessage = "Failed to initialize chatbot";
    let details = error;
    
    if (error instanceof Error) {
      if (error.message.includes("No documents were successfully loaded")) {
        errorMessage = "No documents were successfully loaded. Please check your file formats and try again.";
      } else if (error.message.includes("ERR_INVALID_ARG_TYPE")) {
        errorMessage = "There was an error processing your files. Please try a different file format.";
      }
    }
    
    return NextResponse.json(
      { error: errorMessage, details },
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
