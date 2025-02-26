import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getChatbot } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ chatbotId: string }> },
) {
  try {
    const { chatbotId } = await context.params;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the chatbot
    const chatbot = await getChatbot(chatbotId);
    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }

    // Check if this user owns the chatbot
    if (chatbot.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to access this chatbot" },
        { status: 403 },
      );
    }

    return NextResponse.json({
      chatbot,
    });
  } catch (error) {
    console.error("Error fetching chatbot details:", error);
    return NextResponse.json(
      { error: "Failed to fetch chatbot details" },
      { status: 500 },
    );
  }
}
