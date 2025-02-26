import { ConversationalRetrievalQAChain } from "langchain/chains";

export interface ChatbotSource {
  type: "pdf" | "url";
  path: string;
}

export interface ChatbotConfig {
  modelName?: string;
  customPrompt?: string;
}

export type ChatbotChain = ConversationalRetrievalQAChain;
