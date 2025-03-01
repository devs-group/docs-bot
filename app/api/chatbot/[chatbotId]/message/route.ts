import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getChatbot, getSourcesForChatbot } from "@/lib/storage";
import { createChatBot, retrieveChatBot } from "@/lib/chatbot";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { verifyApiKey } from "@/lib/api-key";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ chatbotId: string }> },
) {
  try {
    const { chatbotId } = await context.params;
    
    // Check for authentication - either session or API key
    const session = await getServerSession(authOptions);
    let userId = session?.user?.id;
    
    // If no session, check for API key in Authorization header
    if (!userId) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const apiKey = authHeader.substring(7); // Remove "Bearer " prefix
        const validApiKey = await verifyApiKey(apiKey);
        
        if (validApiKey) {
          userId = validApiKey.userId;
        }
      }
    }
    
    // If still no userId, return unauthorized
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please provide a valid API key or log in." },
        { status: 401 }
      );
    }

    const chatbot = await getChatbot(chatbotId);
    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }

    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    let chain: ConversationalRetrievalQAChain;
    try {
      // Try to retrieve the existing chatbot
      chain = await retrieveChatBot(chatbotId, chatbot.config);
    } catch (error) {
      console.error(error);
      // If no embeddings exist, create the chatbot
      console.log(
        `No embeddings found for chatbot ${chatbotId}, creating new chain`,
      );
      const sources = await getSourcesForChatbot(chatbotId);
      if (!sources || sources.length === 0) {
        return NextResponse.json(
          { error: "No sources available to create chatbot" },
          { status: 400 },
        );
      }
      chain = await createChatBot(sources, chatbotId, chatbot.config);
    }

    const response = await chain.call({ question: message });

    return NextResponse.json({ response: response.text });
  } catch (error) {
    console.error("Error processing message:", error);
    return NextResponse.json(
      { error: "Failed to process message", details: error },
      { status: 500 },
    );
  }
}
