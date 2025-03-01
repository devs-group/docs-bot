import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deleteApiKey, revokeApiKey } from "@/lib/api-key";

// DELETE /api/api-keys/[keyId] - Delete an API key
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ keyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { keyId } = await context.params;
    
    await deleteApiKey(keyId, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting API key:", error);
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 }
    );
  }
}

// PATCH /api/api-keys/[keyId] - Update an API key (revoke)
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ keyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { keyId } = await context.params;
    const body = await req.json();
    const { isActive } = body;

    if (isActive === false) {
      await revokeApiKey(keyId, session.user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating API key:", error);
    return NextResponse.json(
      { error: "Failed to update API key" },
      { status: 500 }
    );
  }
}
