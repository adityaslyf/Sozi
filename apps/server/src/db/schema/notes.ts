import { pgTable, uuid, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { files } from "./files";
import { workspaces } from "./workspaces";
import { users } from "./users";

export const notes = pgTable("notes", {
	id: uuid("id").primaryKey().defaultRandom(),
	fileId: uuid("file_id").references(() => files.id, { onDelete: "cascade" }).notNull(),
	workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
	userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
	
	// Note content
	title: varchar("title", { length: 255 }).default("Personal Note"),
	content: text("content").notNull().default(""),
	
	// Timestamps
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notesRelations = relations(notes, ({ one }) => ({
	file: one(files, {
		fields: [notes.fileId],
		references: [files.id],
	}),
	workspace: one(workspaces, {
		fields: [notes.workspaceId],
		references: [workspaces.id],
	}),
	user: one(users, {
		fields: [notes.userId],
		references: [users.id],
	}),
}));
