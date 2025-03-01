import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getVoiceContentById, deleteVoiceContent } from "@/lib/voice";

export async function GET(
  req: NextRequest,
  { params }: { params: { voiceId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const voiceId = params.voiceId;
    const voiceContent = await getVoiceContentById(voiceId);

    if (!voiceContent) {
      return NextResponse.json(
        { error: "Voice content not found" },
        { status: 404 }
      );
    }

    // Check if the voice content belongs to the user
    if (voiceContent.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(voiceContent);
  } catch (error) {
    console.error("Error fetching voice content:", error);
    return NextResponse.json(
      { error: "Failed to fetch voice content", details: error },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { voiceId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const voiceId = params.voiceId;
    const voiceContent = await getVoiceContentById(voiceId);

    if (!voiceContent) {
      return NextResponse.json(
        { error: "Voice content not found" },
        { status: 404 }
      );
    }

    // Check if the voice content belongs to the user
    if (voiceContent.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete the voice content
    await deleteVoiceContent(voiceId);

    return NextResponse.json({
      message: "Voice content deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting voice content:", error);
    return NextResponse.json(
      { error: "Failed to delete voice content", details: error },
      { status: 500 }
    );
  }
}
