import { NextResponse, NextRequest } from "next/server";
import { getChatbot } from "@/lib/storage";

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

    const response = await chatbot.chain.call({
      question: message,
    });

    return NextResponse.json({
      response: response.text,
    });
  } catch (error) {
    console.error("Error processing message:", error);
    return NextResponse.json(
      { error: "Failed to process message", details: error },
      { status: 500 },
    );
  }
}
