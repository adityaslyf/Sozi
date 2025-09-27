import { db } from "../db/index.js";
import { summaries } from "../db/schema/summaries.js";
import { eq, and } from "drizzle-orm";

export class SummaryDbService {
	/**
	 * Create a new summary record
	 */
	static async createSummary(data: {
		fileId: string;
		workspaceId: string;
		summary: string;
		keyTopics: string[];
		structure: Array<{ heading: string; content: string }>;
		type?: string;
	}) {
		const [summary] = await db.insert(summaries).values({
			fileId: data.fileId,
			workspaceId: data.workspaceId,
			summary: data.summary,
			keyTopics: data.keyTopics,
			structure: data.structure,
			type: data.type || "golden",
			status: "ready",
		}).returning();

		return summary;
	}

	/**
	 * Get summary by file ID
	 */
	static async getSummaryByFileId(fileId: string, workspaceId: string) {
		const [summary] = await db
			.select()
			.from(summaries)
			.where(and(
				eq(summaries.fileId, fileId),
				eq(summaries.workspaceId, workspaceId)
			))
			.limit(1);

		return summary || null;
	}

	/**
	 * Get all summaries for a workspace
	 */
	static async getWorkspaceSummaries(workspaceId: string) {
		return await db
			.select()
			.from(summaries)
			.where(eq(summaries.workspaceId, workspaceId))
			.orderBy(summaries.createdAt);
	}

	/**
	 * Update summary status
	 */
	static async updateSummaryStatus(summaryId: string, status: string) {
		const [updated] = await db
			.update(summaries)
			.set({ 
				status,
				updatedAt: new Date()
			})
			.where(eq(summaries.id, summaryId))
			.returning();

		return updated;
	}

	/**
	 * Delete summary
	 */
	static async deleteSummary(summaryId: string, workspaceId: string) {
		await db
			.delete(summaries)
			.where(and(
				eq(summaries.id, summaryId),
				eq(summaries.workspaceId, workspaceId)
			));
	}

	/**
	 * Delete summaries by file ID
	 */
	static async deleteSummariesByFileId(fileId: string) {
		await db
			.delete(summaries)
			.where(eq(summaries.fileId, fileId));
	}

	/**
	 * Check if summary exists for file
	 */
	static async summaryExists(fileId: string, workspaceId: string): Promise<boolean> {
		const [summary] = await db
			.select({ id: summaries.id })
			.from(summaries)
			.where(and(
				eq(summaries.fileId, fileId),
				eq(summaries.workspaceId, workspaceId)
			))
			.limit(1);

		return !!summary;
	}
}
