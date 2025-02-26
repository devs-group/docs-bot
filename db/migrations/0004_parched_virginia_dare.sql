ALTER TABLE "chatbots" ADD COLUMN "embedding" vector(1536);--> statement-breakpoint
CREATE INDEX "embeddingIndex" ON "chatbots" USING hnsw ("embedding" vector_cosine_ops);