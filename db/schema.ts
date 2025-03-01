import {
  pgTable,
  text,
  timestamp,
  uuid,
  json,
  vector,
  index,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { InferModel } from "drizzle-orm";
import { ChatbotChain, ChatbotConfig, ChatbotSource, VoiceContent } from "@/types/chatbot";

export type ChatbotData = InferModel<typeof chatbots> & {
  config: ChatbotConfig;
  sources: ChatbotSource[];
  chain: ChatbotChain;
};

export type VoiceData = InferModel<typeof voices> & {
  source: ChatbotSource;
};

export type ApiKeyData = InferModel<typeof apiKeys>;

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: timestamp("expires_at", { mode: "date" }),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionToken: text("session_token").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const chatbots = pgTable(
  "chatbots",
  {
    id: uuid("id").primaryKey().defaultRandom(), // Ensure ID is always generated
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    chain: json("chain").notNull().default("{}"),
    config: json("config").notNull().default("{}"),
    sources: json("sources").notNull().default("[]"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
  },
  (table) => [
    index("embeddingIndex").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
);

export const chatbotSources = pgTable("chatbot_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatbotId: uuid("chatbot_id")
    .notNull()
    .references(() => chatbots.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "pdf" or "url"
  path: text("path").notNull(), // File path or URL
});

export const voices = pgTable("voices", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  content: text("content").notNull(),
  voiceId: text("voice_id").notNull(),
  audioUrl: text("audio_url"),
  length: integer("length").notNull(),
  source: json("source").notNull().default("{}"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});
