import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserChatbots } from "@/lib/storage";
import { ChatbotData } from "@/db/schema";

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get chatbots for this user
    const userChatbots = await getUserChatbots(session.user.id);

    // Format the chatbots for the frontend
    const formattedChatbots = userChatbots.map((chatbot: ChatbotData) => ({
      id: chatbot.id,
      name: chatbot.name || "", // You may need to add name to your storage
      createdAt: chatbot.createdAt.toISOString(),
      modelName: JSON.parse(chatbot.config).modelName,
      sources: chatbot.sources,
    }));

    return NextResponse.json({
      chatbots: formattedChatbots,
    });
  } catch (error) {
    console.error("Error listing chatbots:", error);
    return NextResponse.json(
      { error: "Failed to list chatbots" },
      { status: 500 },
    );
  }
}
