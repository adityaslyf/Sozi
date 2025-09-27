import { db } from "../db/index.js";
import { notes } from "../db/schema/notes.js";
import { eq, and, desc } from "drizzle-orm";

export class NotesService {
	/**
	 * Create a new note
	 */
	static async createNote(data: {
		fileId: string;
		workspaceId: string;
		userId: string;
		title?: string;
		content: string;
	}) {
		const [newNote] = await db
			.insert(notes)
			.values({
				fileId: data.fileId,
				workspaceId: data.workspaceId,
				userId: data.userId,
				title: data.title || "Personal Note",
				content: data.content,
			})
			.returning();
		return newNote;
	}

	/**
	 * Update an existing note
	 */
	static async updateNote(noteId: string, data: {
		title?: string;
		content?: string;
		userId: string;
		workspaceId: string;
	}) {
		const [updatedNote] = await db
			.update(notes)
			.set({
				...(data.title !== undefined && { title: data.title }),
				...(data.content !== undefined && { content: data.content }),
				updatedAt: new Date(),
			})
			.where(and(
				eq(notes.id, noteId),
				eq(notes.userId, data.userId),
				eq(notes.workspaceId, data.workspaceId)
			))
			.returning();
		return updatedNote;
	}

	/**
	 * Get all notes by file ID for a specific user
	 */
	static async getNotesByFileId(fileId: string, workspaceId: string, userId: string) {
		return await db
			.select()
			.from(notes)
			.where(and(
				eq(notes.fileId, fileId),
				eq(notes.workspaceId, workspaceId),
				eq(notes.userId, userId)
			))
			.orderBy(desc(notes.updatedAt));
	}

	/**
	 * Get a specific note by ID
	 */
	static async getNoteById(noteId: string, userId: string, workspaceId: string) {
		const [note] = await db
			.select()
			.from(notes)
			.where(and(
				eq(notes.id, noteId),
				eq(notes.userId, userId),
				eq(notes.workspaceId, workspaceId)
			))
			.limit(1);

		return note;
	}

	/**
	 * Get all notes for a workspace by user
	 */
	static async getNotesByWorkspace(workspaceId: string, userId: string) {
		return await db
			.select()
			.from(notes)
			.where(and(
				eq(notes.workspaceId, workspaceId),
				eq(notes.userId, userId)
			))
			.orderBy(notes.updatedAt);
	}

	/**
	 * Delete a specific note
	 */
	static async deleteNote(noteId: string, userId: string, workspaceId: string) {
		await db
			.delete(notes)
			.where(and(
				eq(notes.id, noteId),
				eq(notes.userId, userId),
				eq(notes.workspaceId, workspaceId)
			));
	}

	/**
	 * Delete all notes by file ID
	 */
	static async deleteNotesByFileId(fileId: string, workspaceId: string, userId: string) {
		await db
			.delete(notes)
			.where(and(
				eq(notes.fileId, fileId),
				eq(notes.workspaceId, workspaceId),
				eq(notes.userId, userId)
			));
	}

	/**
	 * Check if notes exist for a file
	 */
	static async notesExist(fileId: string, workspaceId: string, userId: string): Promise<boolean> {
		const userNotes = await this.getNotesByFileId(fileId, workspaceId, userId);
		return userNotes.length > 0;
	}
}
