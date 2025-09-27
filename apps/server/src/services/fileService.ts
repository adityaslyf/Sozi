import { db } from "../db/index.js";
import { files, type File, type NewFile } from "../db/schema/files.js";
import { eq, and } from "drizzle-orm";

export class FileService {
	/**
	 * Create a new file record
	 */
	static async createFile(fileData: NewFile): Promise<File> {
		const result = await db.insert(files).values({
			...fileData,
			createdAt: new Date(),
			updatedAt: new Date(),
		}).returning();
		
		return result[0];
	}

	/**
	 * Get all files for a workspace
	 */
	static async getWorkspaceFiles(workspaceId: string): Promise<File[]> {
		return await db.select()
			.from(files)
			.where(eq(files.workspaceId, workspaceId))
			.orderBy(files.createdAt);
	}

	/**
	 * Get a specific file by ID (with workspace ownership check)
	 */
	static async getFileById(fileId: string, workspaceId: string): Promise<File | null> {
		const result = await db.select()
			.from(files)
			.where(and(
				eq(files.id, fileId),
				eq(files.workspaceId, workspaceId)
			))
			.limit(1);
		
		return result[0] || null;
	}

	/**
	 * Update file status (uploaded, processing, ready, error)
	 */
	static async updateFileStatus(fileId: string, status: string): Promise<File | null> {
		const result = await db.update(files)
			.set({
				status,
				updatedAt: new Date(),
			})
			.where(eq(files.id, fileId))
			.returning();
		
		return result[0] || null;
	}

	/**
	 * Delete a file
	 */
	static async deleteFile(fileId: string, workspaceId: string): Promise<boolean> {
		const result = await db.delete(files)
			.where(and(
				eq(files.id, fileId),
				eq(files.workspaceId, workspaceId)
			))
			.returning();
		
		return result.length > 0;
	}

	/**
	 * Get files by status
	 */
	static async getFilesByStatus(workspaceId: string, status: string): Promise<File[]> {
		return await db.select()
			.from(files)
			.where(and(
				eq(files.workspaceId, workspaceId),
				eq(files.status, status)
			))
			.orderBy(files.createdAt);
	}

	/**
	 * Get file count for a workspace
	 */
	static async getWorkspaceFileCount(workspaceId: string): Promise<number> {
		const result = await db.select()
			.from(files)
			.where(eq(files.workspaceId, workspaceId));
		
		return result.length;
	}
}

