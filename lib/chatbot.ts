import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "@langchain/core/documents";
import { DEFAULT_PROMPT_TEMPLATE } from "./constants";
import { ChatbotConfig, ChatbotSource } from "@/types/chatbot";
import { Pool } from "pg";

// PostgreSQL configuration for PGVectorStore
const pgConfig = {
  postgresConnectionOptions: {
    connectionString:
      process.env.POSTGRES_URL ||
      "postgres://postgres:postgres@localhost:5432/postgres",
  },
  tableName: "chatbot_embeddings",
  columns: {
    idColumnName: "id",
    vectorColumnName: "embedding",
    contentColumnName: "content",
    metadataColumnName: "metadata",
  },
};

// Ensure URLs have a protocol
function normalizeUrl(url: string): string {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
}

export async function createChatBot(
  sources: ChatbotSource[],
  chatbotId: string,
  config?: ChatbotConfig,
): Promise<ConversationalRetrievalQAChain> {
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
      // Tag each document with chatbotId in metadata
      docs.forEach((doc) => {
        doc.metadata.chatbotId = chatbotId;
      });
      allDocs.push(...docs);
    } catch (error) {
      console.error(`Error loading source ${source.path}:`, error);
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

  const vectorStore = await PGVectorStore.fromDocuments(
    splits,
    new OpenAIEmbeddings(),
    pgConfig,
  );

  let promptTemplate = DEFAULT_PROMPT_TEMPLATE;
  if (config?.customPrompt) {
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

async function loadDocument(source: ChatbotSource): Promise<Document[]> {
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
        const normalizedUrl = normalizeUrl(source.path);
        console.log(`Loading URL: ${normalizedUrl}`);
        const response = await fetch(normalizedUrl);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch ${normalizedUrl}: ${response.status} ${response.statusText}`,
          );
        }
        const html = await response.text();
        const plainText = html
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
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

export async function retrieveChatBot(
  chatbotId: string,
  config?: ChatbotConfig,
): Promise<ConversationalRetrievalQAChain> {
  const modelName = config?.modelName || "gpt-4o-mini";

  const model = new ChatOpenAI({
    modelName,
    temperature: 0.7,
    presencePenalty: 0.6,
    frequencyPenalty: 0.5,
  });

  // Check if embeddings exist for this chatbot
  const pool = new Pool(pgConfig.postgresConnectionOptions);
  const { rowCount } = await pool.query(
    `SELECT 1 FROM ${pgConfig.tableName} WHERE metadata->>'chatbotId' = $1 LIMIT 1`,
    [chatbotId],
  );
  await pool.end();

  if (rowCount === 0) {
    throw new Error(`No embeddings found for chatbot ${chatbotId}`);
  }

  // Initialize PGVectorStore with existing table, filtered by chatbotId
  const vectorStore = await PGVectorStore.initialize(new OpenAIEmbeddings(), {
    ...pgConfig,
    filter: { chatbotId }, // Apply filter for this chatbot
  });

  let promptTemplate = DEFAULT_PROMPT_TEMPLATE;
  if (config?.customPrompt) {
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
