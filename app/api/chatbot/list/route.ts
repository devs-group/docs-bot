import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserChatbots } from "@/lib/storage";

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatbots = await getUserChatbots(session.user.id);

    return NextResponse.json({
      chatbots,
    });
  } catch (error) {
    console.error("Error listing chatbots:", error);
    return NextResponse.json(
      { error: "Failed to list chatbots" },
      { status: 500 },
    );
  }
}
