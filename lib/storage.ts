import { ChatbotChain, ChatbotSource } from "@/types/chatbot";
import { db } from "@/db";
import { chatbots, chatbotSources, ChatbotData } from "@/db/schema";
import { eq } from "drizzle-orm";

export type ChatbotConfig = {
  modelName: string;
  customPrompt?: string;
};

export async function getSourcesForChatbot(
  chatbotId: string,
): Promise<ChatbotSource[]> {
  const results = await db
    .select({
      type: chatbotSources.type,
      path: chatbotSources.path,
    })
    .from(chatbotSources)
    .where(eq(chatbotSources.chatbotId, chatbotId));

  return results as ChatbotSource[];
}

export async function storeChatbot(
  id: string,
  name: string,
  userId: string,
  chain: ChatbotChain,
  sources: ChatbotSource[],
  config: ChatbotConfig,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.insert(chatbots).values({
      id,
      name,
      userId,
      chain: chain,
      createdAt: new Date(),
      config: config,
      sources: sources,
    });
  });
}

export async function getChatbot(id: string): Promise<ChatbotData | undefined> {
  const result = await db
    .select()
    .from(chatbots)
    .where(eq(chatbots.id, id))
    .limit(1);

  if (!result.length) return undefined;

  const chatbot = result[0];
  return {
    id: chatbot.id,
    name: chatbot.name,
    userId: chatbot.userId,
    createdAt: chatbot.createdAt,
    config: chatbot.config as ChatbotConfig,
    chain: chatbot.chain as ChatbotChain,
    sources: chatbot.sources as ChatbotSource[],
    embedding: chatbot.embedding,
  };
}

export async function deleteChatbot(id: string): Promise<boolean> {
  const result = await db.delete(chatbots).where(eq(chatbots.id, id));
  return (result.rowCount ?? 0) > 0;
}

export async function getUserChatbots(userId: string): Promise<ChatbotData[]> {
  const results = await db
    .select()
    .from(chatbots)
    .where(eq(chatbots.userId, userId));

  return results as ChatbotData[];
}
