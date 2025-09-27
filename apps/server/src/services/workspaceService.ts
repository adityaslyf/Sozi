import { db } from "../db/index.js";
import { workspaces, type Workspace, type NewWorkspace } from "../db/schema/workspaces.js";
import { eq, and } from "drizzle-orm";

export class WorkspaceService {
	/**
	 * Create a new workspace
	 */
	static async createWorkspace(workspaceData: NewWorkspace): Promise<Workspace> {
		const result = await db.insert(workspaces).values({
			...workspaceData,
			createdAt: new Date(),
			updatedAt: new Date(),
		}).returning();
		
		return result[0];
	}

	/**
	 * Get all workspaces for a user
	 */
	static async getUserWorkspaces(userId: string): Promise<Workspace[]> {
		return await db.select()
			.from(workspaces)
			.where(eq(workspaces.userId, userId))
			.orderBy(workspaces.createdAt);
	}

	/**
	 * Get a specific workspace by ID (with user ownership check)
	 */
	static async getWorkspaceById(workspaceId: string, userId: string): Promise<Workspace | null> {
		const result = await db.select()
			.from(workspaces)
			.where(and(
				eq(workspaces.id, workspaceId),
				eq(workspaces.userId, userId)
			))
			.limit(1);
		
		return result[0] || null;
	}

	/**
	 * Update a workspace
	 */
	static async updateWorkspace(
		workspaceId: string, 
		userId: string, 
		updateData: Partial<Pick<Workspace, 'name' | 'description'>>
	): Promise<Workspace | null> {
		const result = await db.update(workspaces)
			.set({
				...updateData,
				updatedAt: new Date(),
			})
			.where(and(
				eq(workspaces.id, workspaceId),
				eq(workspaces.userId, userId)
			))
			.returning();
		
		return result[0] || null;
	}

	/**
	 * Delete a workspace
	 */
	static async deleteWorkspace(workspaceId: string, userId: string): Promise<boolean> {
		const result = await db.delete(workspaces)
			.where(and(
				eq(workspaces.id, workspaceId),
				eq(workspaces.userId, userId)
			))
			.returning();
		
		return result.length > 0;
	}

	/**
	 * Check if user owns a workspace
	 */
	static async isWorkspaceOwner(workspaceId: string, userId: string): Promise<boolean> {
		const workspace = await this.getWorkspaceById(workspaceId, userId);
		return workspace !== null;
	}

	/**
	 * Get workspace count for a user
	 */
	static async getUserWorkspaceCount(userId: string): Promise<number> {
		const result = await db.select()
			.from(workspaces)
			.where(eq(workspaces.userId, userId));
		
		return result.length;
	}
}
