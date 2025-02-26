import { NextRequest, NextResponse } from "next/server";
import { parseFormData } from "@/lib/upload";
import { createChatBot } from "@/lib/chatbot";
import { storeChatbot } from "@/lib/storage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust this path as needed
import { v4 as uuidv4 } from "uuid";
import { ChatbotSource } from "@/types/chatbot";

// Helper function to normalize URLs
function normalizeUrl(url: string): string {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
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
        { error: "No sources provided" },
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
    return NextResponse.json(
      { error: "Failed to initialize chatbot", details: error },
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
