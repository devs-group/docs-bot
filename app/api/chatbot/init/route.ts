import { NextRequest, NextResponse } from "next/server";
import { parseFormData } from "@/lib/upload";
import { createChatBot } from "@/lib/chatbot";
import { storeChatbot } from "@/lib/storage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust this path as needed
import { Source } from "@/types/chatbot";
import { v4 as uuidv4 } from "uuid";

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
    const sources: Source[] = [];

    // Process uploaded PDF files
    for (const file of files) {
      if (file.name.toLowerCase().endsWith(".pdf")) {
        sources.push({
          type: "pdf",
          path: file.path,
        });
      }
    }

    // Process URLs - ensure they're normalized
    const urls = fields.urls;
    if (urls) {
      if (Array.isArray(urls)) {
        for (const url of urls) {
          if (url.trim()) {
            sources.push({
              type: "url",
              path: normalizeUrl(url.trim()),
            });
          }
        }
      } else if (typeof urls === "string" && urls.trim()) {
        sources.push({
          type: "url",
          path: normalizeUrl(urls.trim()),
        });
      }
    }

    if (sources.length === 0) {
      return NextResponse.json(
        { error: "No sources provided" },
        { status: 400 },
      );
    }

    // Extract model and custom prompt from request
    const modelName = fields.model || "gpt-4o-mini";
    const customPrompt = fields.customPrompt || undefined;
    const name = (fields.name as string) || "";

    const chatbotId = uuidv4();
    const chain = await createChatBot(sources, {
      modelName: modelName as string,
      customPrompt: customPrompt as string | undefined,
    });

    // Save configuration along with chatbot
    storeChatbot(chatbotId, name, session.user.id, chain, sources, {
      modelName: modelName as string,
      customPrompt: customPrompt as string | undefined,
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
    bodyParser: false,
    responseLimit: "100mb",
  },
};
