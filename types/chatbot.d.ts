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

export interface VoiceContent {
  id: string;
  userId: string;
  name: string;
  content: string;
  voiceId: string;
  audioUrl?: string;
  length: number;
  createdAt: Date;
  source: ChatbotSource;
}

export interface VoiceConfig {
  voiceId: string;
  length: number;
}
