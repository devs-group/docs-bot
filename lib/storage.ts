import { ConversationalRetrievalQAChain } from "langchain/chains";
import { Source } from "@/types/chatbot";
import { db } from "@/db";
import { chatbots, chatbotSources, ChatbotData } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { createChatBot } from "@/lib/chatbot";

export type ChatbotConfig = {
  modelName: string;
  customPrompt?: string;
};

export async function storeChatbot(
  id: string,
  name: string,
  userId: string,
  chain: ConversationalRetrievalQAChain,
  sources: Source[],
  config: ChatbotConfig,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.insert(chatbots).values({
      id,
      name,
      userId,
      chain: JSON.stringify(chain),
      createdAt: new Date(),
      config: JSON.stringify(config),
    });
    if (sources.length > 0) {
      await tx.insert(chatbotSources).values(
        sources.map((source) => ({
          id: randomUUID(),
          chatbotId: id,
          type: source.type,
          path: source.path,
        })),
      );
    }
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
  const chain = await recreateChain(chatbot.id);
  return {
    id: chatbot.id,
    name: chatbot.name,
    userId: chatbot.userId,
    createdAt: chatbot.createdAt,
    config: JSON.stringify(chatbot.config),
    chain: JSON.stringify(chain),
    sources: JSON.stringify(chatbot.sources),
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

  return Promise.all(
    results.map(async (chatbot) => {
      const chain = await recreateChain(chatbot.id);
      return {
        id: chatbot.id,
        name: chatbot.name,
        userId: chatbot.userId,
        createdAt: chatbot.createdAt,
        config: JSON.stringify(chatbot.config),
        chain: JSON.stringify(chain),
        sources: JSON.stringify(chatbot.sources),
      };
    }),
  );
}

export async function getAllChatbots(): Promise<ChatbotData[]> {
  const results = await db.select().from(chatbots);

  return Promise.all(
    results.map(async (chatbot) => {
      const chain = await recreateChain(chatbot.id);
      return {
        id: chatbot.id,
        name: chatbot.name,
        userId: chatbot.userId,
        createdAt: chatbot.createdAt,
        config: JSON.stringify(chatbot.config),
        chain: JSON.stringify(chain),
        sources: JSON.stringify(chatbot.sources),
      };
    }),
  );
}

async function recreateChain(
  chatbotId: string,
): Promise<ConversationalRetrievalQAChain> {
  const rawSources = await db
    .select({ type: chatbotSources.type, path: chatbotSources.path })
    .from(chatbotSources)
    .where(eq(chatbotSources.chatbotId, chatbotId));

  const sources = rawSources as Source[];
  return createChatBot(sources);
}
