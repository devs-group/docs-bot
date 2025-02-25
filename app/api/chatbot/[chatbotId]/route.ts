import { NextRequest, NextResponse } from "next/server";
import { deleteChatbot, getChatbot } from "@/lib/storage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { chatbotId: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatbotId } = params;
    const chatbot = await getChatbot(chatbotId);

    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }

    if (chatbot.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You don't own this chatbot" },
        { status: 403 },
      );
    }

    deleteChatbot(chatbotId);
    return NextResponse.json({ message: "Chatbot deleted successfully" });
  } catch (error) {
    console.error("Error deleting chatbot:", error);
    return NextResponse.json(
      { error: "Failed to delete chatbot", details: error },
      { status: 500 },
    );
  }
}
