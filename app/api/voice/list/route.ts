import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserVoiceContent } from "@/lib/voice";

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all voice content for the user
    const voiceContent = await getUserVoiceContent(session.user.id);

    return NextResponse.json({
      voiceContent,
      count: voiceContent.length,
    });
  } catch (error) {
    console.error("Error fetching voice content:", error);
    return NextResponse.json(
      { error: "Failed to fetch voice content", details: error },
      { status: 500 },
    );
  }
}
