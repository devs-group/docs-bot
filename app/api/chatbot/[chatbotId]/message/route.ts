import { NextResponse, NextRequest } from "next/server";
import { getChatbot, getSourcesForChatbot } from "@/lib/storage";
import { createChatBot, retrieveChatBot } from "@/lib/chatbot";
import { ConversationalRetrievalQAChain } from "langchain/chains";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ chatbotId: string }> },
) {
  try {
    const { chatbotId } = await context.params;

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
