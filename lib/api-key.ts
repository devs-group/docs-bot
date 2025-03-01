import { randomUUID, randomBytes, createHash } from "crypto";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Generate a secure API key with a prefix for easy identification
export function generateApiKey(prefix = "docbot") {
  const uuid = randomUUID();
  const bytes = randomBytes(32);
  const hash = createHash("sha256").update(bytes).digest("hex");
  return `${prefix}_${uuid.replace(/-/g, "")}_${hash.substring(0, 32)}`;
}

// Create a new API key for a user
export async function createApiKey(userId: string, name: string) {
  const key = generateApiKey();
  
  const result = await db.insert(apiKeys).values({
    userId,
    name,
    key,
  }).returning();
  
  return result[0];
}

// List all API keys for a user
export async function listApiKeys(userId: string) {
  return await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
}

// Get an API key by its value
export async function getApiKeyByValue(key: string) {
  const result = await db.select().from(apiKeys).where(eq(apiKeys.key, key));
  return result[0] || null;
}

// Verify if an API key is valid and belongs to a user
export async function verifyApiKey(key: string) {
  const apiKey = await getApiKeyByValue(key);
  
  if (!apiKey) {
    return null;
  }
  
  if (!apiKey.isActive) {
    return null;
  }
  
  if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
    return null;
  }
  
  // Update last used timestamp
  await db.update(apiKeys)
    .set({ lastUsed: new Date() })
    .where(eq(apiKeys.id, apiKey.id));
  
  return apiKey;
}

// Delete an API key
export async function deleteApiKey(id: string, userId: string) {
  return await db.delete(apiKeys)
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));
}

// Revoke an API key (set isActive to false)
export async function revokeApiKey(id: string, userId: string) {
  return await db.update(apiKeys)
    .set({ isActive: false })
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));
}
