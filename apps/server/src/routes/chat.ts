import express from "express";
import jwt from "jsonwebtoken";
import { ChatService } from "../services/chatService.js";
import { WorkspaceService } from "../services/workspaceService.js";
import { FileService } from "../services/fileService.js";

const router = express.Router();

// Middleware to authenticate user
const authenticateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({
				success: false,
				message: "No token provided",
			});
		}

		const token = authHeader.substring(7);
		const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as { userId: string };
		(req as express.Request & { user: { userId: string } }).user = decoded;
		next();
	} catch {
		return res.status(401).json({
			success: false,
			message: "Invalid or expired token",
		});
	}
};

/**
 * POST /workspaces/:workspaceId/chat - Send a chat message
 */
router.post("/:workspaceId/chat", authenticateUser, async (req: express.Request & { user: { userId: string } }, res: express.Response) => {
	try {
		const { workspaceId } = req.params;
		const { message, fileId, conversationHistory } = req.body;
		const userId = req.user.userId;

		// Validate input
		if (!message || typeof message !== 'string' || message.trim().length === 0) {
			return res.status(400).json({ 
				success: false, 
				message: "Message is required and cannot be empty" 
			});
		}

		if (message.length > 2000) {
			return res.status(400).json({ 
				success: false, 
				message: "Message is too long (max 2000 characters)" 
			});
		}

		// Verify workspace ownership
		const workspace = await WorkspaceService.getWorkspaceById(workspaceId, userId);
		if (!workspace) {
			return res.status(404).json({ success: false, message: "Workspace not found" });
		}

		// If fileId is provided, verify file exists and belongs to workspace
		if (fileId) {
			const file = await FileService.getFileById(fileId, workspaceId);
			if (!file) {
				return res.status(404).json({ success: false, message: "File not found" });
			}

			// Check if file is ready (has been processed)
			if (file.status !== 'ready') {
				return res.status(400).json({ 
					success: false, 
					message: "File is not ready for chat. Please wait for processing to complete." 
				});
			}
		}

		// Process the chat message
		const response = await ChatService.processMessage({
			message: message.trim(),
			fileId,
			workspaceId,
			conversationHistory: conversationHistory || []
		});

		res.status(200).json({
			success: true,
			message: "Message processed successfully",
			response: response.message,
			sources: response.sources,
			metadata: {
				workspaceId,
				fileId,
				timestamp: new Date().toISOString(),
				sourcesCount: response.sources.length
			}
		});

	} catch (error) {
		console.error("Error processing chat message:", error);
		res.status(500).json({
			success: false,
			message: "Failed to process chat message",
			error: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : "Internal server error",
		});
	}
});

/**
 * POST /workspaces/:workspaceId/files/:fileId/chat - Send a chat message about a specific file
 */
router.post("/:workspaceId/files/:fileId/chat", authenticateUser, async (req: express.Request & { user: { userId: string } }, res: express.Response) => {
	try {
		const { workspaceId, fileId } = req.params;
		const { message, conversationHistory } = req.body;
		const userId = req.user.userId;

		// Validate input
		if (!message || typeof message !== 'string' || message.trim().length === 0) {
			return res.status(400).json({ 
				success: false, 
				message: "Message is required and cannot be empty" 
			});
		}

		if (message.length > 2000) {
			return res.status(400).json({ 
				success: false, 
				message: "Message is too long (max 2000 characters)" 
			});
		}

		// Verify workspace ownership
		const workspace = await WorkspaceService.getWorkspaceById(workspaceId, userId);
		if (!workspace) {
			return res.status(404).json({ success: false, message: "Workspace not found" });
		}

		// Verify file exists and belongs to workspace
		const file = await FileService.getFileById(fileId, workspaceId);
		if (!file) {
			return res.status(404).json({ success: false, message: "File not found" });
		}

		// Check if file is ready (has been processed)
		if (file.status !== 'ready') {
			return res.status(400).json({ 
				success: false, 
				message: "File is not ready for chat. Please wait for processing to complete." 
			});
		}

		// Process the chat message
		const response = await ChatService.processMessage({
			message: message.trim(),
			fileId,
			workspaceId,
			conversationHistory: conversationHistory || []
		});

		res.status(200).json({
			success: true,
			message: "Message processed successfully",
			response: response.message,
			sources: response.sources,
			metadata: {
				workspaceId,
				fileId,
				fileName: file.name,
				timestamp: new Date().toISOString(),
				sourcesCount: response.sources.length
			}
		});

	} catch (error) {
		console.error("Error processing file chat message:", error);
		res.status(500).json({
			success: false,
			message: "Failed to process chat message",
			error: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : "Internal server error",
		});
	}
});

/**
 * GET /workspaces/:workspaceId/chat/history/:conversationId - Get chat history (placeholder)
 */
router.get("/:workspaceId/chat/history/:conversationId", authenticateUser, async (req: express.Request & { user: { userId: string } }, res: express.Response) => {
	try {
		const { workspaceId, conversationId } = req.params;
		const userId = req.user.userId;

		// Verify workspace ownership
		const workspace = await WorkspaceService.getWorkspaceById(workspaceId, userId);
		if (!workspace) {
			return res.status(404).json({ success: false, message: "Workspace not found" });
		}

		// Get chat history (placeholder implementation)
		const history = await ChatService.getChatHistory(conversationId);

		res.status(200).json({
			success: true,
			history,
			metadata: {
				workspaceId,
				conversationId,
				messageCount: history.length
			}
		});

	} catch (error) {
		console.error("Error getting chat history:", error);
		res.status(500).json({
			success: false,
			message: "Failed to get chat history",
			error: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : "Internal server error",
		});
	}
});

export default router;
