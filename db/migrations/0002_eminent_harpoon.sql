ALTER TABLE "chatbots" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "chatbots" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "chatbots" ADD COLUMN "chain" json DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "chatbots" ADD COLUMN "config" json DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "chatbots" ADD COLUMN "sources" json DEFAULT '[]' NOT NULL;