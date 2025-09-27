import { pgTable, uuid, text, jsonb, timestamp, varchar } from "drizzle-orm/pg-core";
import { files } from "./files";
import { workspaces } from "./workspaces";

export const summaries = pgTable("summaries", {
	id: uuid("id").primaryKey().defaultRandom(),
	fileId: uuid("file_id").references(() => files.id, { onDelete: "cascade" }).notNull(),
	workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
	
	// Summary content
	summary: text("summary").notNull(), // Main summary text
	keyTopics: jsonb("key_topics").$type<string[]>().default([]), // Array of key topics
	structure: jsonb("structure").$type<Array<{ heading: string; content: string }>>().default([]), // Structured sections
	
	// Metadata
	type: varchar("type", { length: 50 }).default("golden"), // "golden", "quick", "auto"
	status: varchar("status", { length: 20 }).default("ready"), // "generating", "ready", "error"
	
	// Timestamps
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
