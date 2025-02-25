import { ConversationalRetrievalQAChain } from "langchain/chains";

export interface Source {
  type: "pdf" | "url";
  path: string;
}

export interface ChatbotConfig {
  modelName: string;
  customPrompt?: string;
}

export interface StoredChatbot {
  id: string;
  name?: string;
  chain: ConversationalRetrievalQAChain;
  userId: string;
  sources: Source[];
  config: ChatbotConfig;
  createdAt: Date;
}