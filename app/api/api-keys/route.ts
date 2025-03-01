import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createApiKey, listApiKeys } from "@/lib/api-key";

// GET /api/api-keys - List all API keys for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKeys = await listApiKeys(session.user.id);
    
    // Don't return the actual key values for security
    const safeApiKeys = apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      createdAt: key.createdAt,
      lastUsed: key.lastUsed,
      isActive: key.isActive,
      expiresAt: key.expiresAt,
    }));

    return NextResponse.json({ apiKeys: safeApiKeys });
  } catch (error) {
    console.error("Error listing API keys:", error);
    return NextResponse.json(
      { error: "Failed to list API keys" },
      { status: 500 }
    );
  }
}

// POST /api/api-keys - Create a new API key
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const apiKey = await createApiKey(session.user.id, name);

    return NextResponse.json({
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        key: apiKey.key, // Only return the full key value once
        createdAt: apiKey.createdAt,
      }
    });
  } catch (error) {
    console.error("Error creating API key:", error);
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    );
  }
}
