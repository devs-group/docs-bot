import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "@langchain/core/documents";
import { Source } from "@/types/chatbot";
import { DEFAULT_PROMPT_TEMPLATE } from "./constants";

interface ChatbotConfig {
  modelName: string;
  customPrompt?: string;
}

// Ensure URLs have a protocol
function normalizeUrl(url: string): string {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
}

export async function createChatBot(
  sources: Source[],
  config?: ChatbotConfig,
): Promise<ConversationalRetrievalQAChain> {
  // Use config or defaults
  const modelName = config?.modelName || "gpt-4o-mini";

  const model = new ChatOpenAI({
    modelName,
    temperature: 0.7,
    presencePenalty: 0.6,
    frequencyPenalty: 0.5,
  });

  const allDocs: Document[] = [];
  for (const source of sources) {
    try {
      const docs = await loadDocument(source);
      allDocs.push(...docs);
    } catch (error) {
      console.error(`Error loading source ${source.path}:`, error);
      // Continue with other sources instead of failing completely
    }
  }

  if (allDocs.length === 0) {
    throw new Error("No documents were successfully loaded");
  }

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const splits = await textSplitter.splitDocuments(allDocs);
  const vectorStore = await MemoryVectorStore.fromDocuments(
    splits,
    new OpenAIEmbeddings(),
  );

  // Use custom prompt if provided, otherwise use default
  let promptTemplate = DEFAULT_PROMPT_TEMPLATE;
  if (config?.customPrompt) {
    // Make sure the prompt includes the required placeholders
    let customPrompt = config.customPrompt;
    if (!customPrompt.includes("{context}")) {
      customPrompt += "\nContext: {context}";
    }
    if (!customPrompt.includes("{question}")) {
      customPrompt += "\nQuestion: {question}";
    }
    promptTemplate = customPrompt;
  }

  const prompt = PromptTemplate.fromTemplate(promptTemplate);
  const memory = new BufferMemory({
    memoryKey: "chat_history",
    returnMessages: true,
    inputKey: "question",
    outputKey: "text",
  });

  const chain = ConversationalRetrievalQAChain.fromLLM(
    model,
    vectorStore.asRetriever(),
    {
      memory,
      verbose: false,
      qaChainOptions: {
        type: "stuff",
        prompt: prompt,
      },
      returnSourceDocuments: true,
    },
  );

  return chain;
}

async function loadDocument(source: Source): Promise<Document[]> {
  switch (source.type) {
    case "pdf":
      try {
        const pdfLoader = new PDFLoader(source.path);
        return await pdfLoader.load();
      } catch (error) {
        console.error(`Error loading PDF ${source.path}:`, error);
        throw error;
      }

    case "url":
      try {
        // Normalize URL
        const normalizedUrl = normalizeUrl(source.path);
        console.log(`Loading URL: ${normalizedUrl}`);

        // Simple fetch implementation - don't use CheerioWebBaseLoader
        const response = await fetch(normalizedUrl);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch ${normalizedUrl}: ${response.status} ${response.statusText}`,
          );
        }

        const html = await response.text();

        // Remove HTML tags to get plain text (very simple approach)
        const plainText = html
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        // Create a document with the plain text content
        return [
          new Document({
            pageContent: plainText,
            metadata: { source: normalizedUrl },
          }),
        ];
      } catch (error) {
        console.error(`Error loading URL ${source.path}:`, error);
        throw error;
      }

    default:
      throw new Error(`Unsupported source type: ${source.type}`);
  }
}
