import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";

export const files = pgTable("files", {
	id: uuid("id").primaryKey().defaultRandom(),
	workspaceId: uuid("workspace_id")
		.references(() => workspaces.id, { onDelete: "cascade" })
		.notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	originalName: varchar("original_name", { length: 255 }).notNull(),
	url: text("url").notNull(), // storage path (local/S3/Supabase)
	size: varchar("size", { length: 50 }), // file size in bytes
	mimeType: varchar("mime_type", { length: 100 }), // application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document
	status: varchar("status", { length: 50 }).default("uploaded"), // uploaded, processing, ready, error
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;

