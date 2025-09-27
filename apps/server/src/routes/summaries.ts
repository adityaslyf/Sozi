import express from "express";
import jwt from "jsonwebtoken";
import { SummaryService } from "../services/summaryService.js";
import { SummaryDbService } from "../services/summaryDbService.js";
import { NotesService } from "../services/notesService.js";
import { WorkspaceService } from "../services/workspaceService.js";
import { FileService } from "../services/fileService.js";

const router = express.Router();

// Middleware to authenticate user
const authenticateUser = async (req: any, res: any, next: any) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({
				success: false,
				message: "No token provided",
			});
		}

		const token = authHeader.substring(7);
		const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
		req.user = decoded;
		next();
	} catch (error) {
		return res.status(401).json({
			success: false,
			message: "Invalid or expired token",
		});
	}
};

/**
 * GET /workspaces/:workspaceId/files/:fileId/summaries - Get all summaries for a file
 */
router.get("/:workspaceId/files/:fileId/summaries", authenticateUser, async (req: any, res) => {
	try {
		const { workspaceId, fileId } = req.params;
		const userId = req.user.userId;

		// Verify workspace ownership
		const workspace = await WorkspaceService.getWorkspaceById(workspaceId, userId);
		if (!workspace) {
			return res.status(404).json({ success: false, message: "Workspace not found" });
		}

		// Get file info
		const file = await FileService.getFileById(fileId, workspaceId);
		if (!file) {
			return res.status(404).json({ success: false, message: "File not found" });
		}

		// Get all summaries
		const summaries = await SummaryDbService.getAllSummariesByFileId(fileId, workspaceId);

		res.status(200).json({
			success: true,
			summaries: summaries.map(summary => ({
				id: summary.id,
				title: summary.title,
				version: summary.version,
				type: summary.type,
				status: summary.status,
				createdAt: summary.createdAt,
				updatedAt: summary.updatedAt,
				keyTopics: summary.keyTopics,
				// Don't include full content in list view
			}))
		});

	} catch (error) {
		console.error("Error retrieving summaries:", error);
		res.status(500).json({
			success: false,
			message: "Failed to retrieve summaries",
			error: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : "Internal server error",
		});
	}
});

/**
 * GET /workspaces/:workspaceId/files/:fileId/summaries/:summaryId - Get specific summary
 */
router.get("/:workspaceId/files/:fileId/summaries/:summaryId", authenticateUser, async (req: any, res) => {
	try {
		const { workspaceId, fileId, summaryId } = req.params;
		const userId = req.user.userId;

		// Verify workspace ownership
		const workspace = await WorkspaceService.getWorkspaceById(workspaceId, userId);
		if (!workspace) {
			return res.status(404).json({ success: false, message: "Workspace not found" });
		}

		// Get summary
		const summary = await SummaryDbService.getSummaryById(summaryId, workspaceId);
		if (!summary || summary.fileId !== fileId) {
			return res.status(404).json({ success: false, message: "Summary not found" });
		}

		res.status(200).json({
			success: true,
			summary: {
				id: summary.id,
				title: summary.title,
				version: summary.version,
				type: summary.type,
				status: summary.status,
				summary: summary.summary,
				keyTopics: summary.keyTopics,
				structure: summary.structure,
				createdAt: summary.createdAt,
				updatedAt: summary.updatedAt,
			}
		});

	} catch (error) {
		console.error("Error retrieving summary:", error);
		res.status(500).json({
			success: false,
			message: "Failed to retrieve summary",
			error: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : "Internal server error",
		});
	}
});

/**
 * POST /workspaces/:workspaceId/files/:fileId/summary - Generate golden summary
 */
router.post("/:workspaceId/files/:fileId/summary", authenticateUser, async (req: any, res) => {
	try {
		const { workspaceId, fileId } = req.params;
		const userId = req.user.userId;
		const { type = "golden", regenerate = false, title } = req.body;

		// Verify workspace ownership
		const workspace = await WorkspaceService.getWorkspaceById(workspaceId, userId);
		if (!workspace) {
			return res.status(404).json({
				success: false,
				message: "Workspace not found",
			});
		}

		// Verify file exists and belongs to workspace
		const file = await FileService.getFileById(fileId, workspaceId);
		if (!file) {
			return res.status(404).json({
				success: false,
				message: "File not found",
			});
		}

		if (file.status !== "ready") {
			return res.status(400).json({
				success: false,
				message: "File is not ready for summary generation",
			});
		}

		// Check if summary already exists
		const existingSummary = await SummaryDbService.getSummaryByFileId(fileId, workspaceId);
		if (existingSummary && !regenerate) {
			return res.json({
				success: true,
				message: "Summary already exists",
				summary: existingSummary,
			});
		}

		// Generate summary
		const summaryData = await SummaryService.generateGoldenSummary(
			fileId,
			file.originalName,
			workspaceId
		);

		// Save to database
		let summary;
		if (existingSummary && regenerate) {
			// Update existing summary
			summary = await SummaryDbService.createSummary({
				fileId,
				workspaceId,
				...summaryData,
				type,
				title,
			});
			// Delete old summary
			await SummaryDbService.deleteSummary(existingSummary.id, workspaceId);
		} else {
			// Create new summary
			summary = await SummaryDbService.createSummary({
				fileId,
				workspaceId,
				...summaryData,
				type,
				title,
			});
		}

		res.json({
			success: true,
			message: "Golden summary generated successfully",
			summary,
		});

	} catch (error) {
		console.error("Generate summary error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to generate summary",
			error: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : "Internal server error",
		});
	}
});

/**
 * GET /workspaces/:workspaceId/files/:fileId/summary - Get file summary
 */
router.get("/:workspaceId/files/:fileId/summary", authenticateUser, async (req: any, res) => {
	try {
		const { workspaceId, fileId } = req.params;
		const userId = req.user.userId;

		// Verify workspace ownership
		const workspace = await WorkspaceService.getWorkspaceById(workspaceId, userId);
		if (!workspace) {
			return res.status(404).json({
				success: false,
				message: "Workspace not found",
			});
		}

		// Get summary
		const summary = await SummaryDbService.getSummaryByFileId(fileId, workspaceId);
		if (!summary) {
			return res.status(404).json({
				success: false,
				message: "Summary not found",
			});
		}

		res.json({
			success: true,
			summary,
		});

	} catch (error) {
		console.error("Get summary error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to get summary",
			error: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : "Internal server error",
		});
	}
});

/**
 * GET /workspaces/:workspaceId/summaries - Get all summaries in workspace
 */
router.get("/:workspaceId/summaries", authenticateUser, async (req: any, res) => {
	try {
		const { workspaceId } = req.params;
		const userId = req.user.userId;

		// Verify workspace ownership
		const workspace = await WorkspaceService.getWorkspaceById(workspaceId, userId);
		if (!workspace) {
			return res.status(404).json({
				success: false,
				message: "Workspace not found",
			});
		}

		// Get all summaries
		const summaries = await SummaryDbService.getWorkspaceSummaries(workspaceId);

		res.json({
			success: true,
			summaries,
		});

	} catch (error) {
		console.error("Get workspace summaries error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to get summaries",
			error: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : "Internal server error",
		});
	}
});

/**
 * POST /workspaces/:workspaceId/files/:fileId/quick-summary - Generate quick summary
 */
router.post("/:workspaceId/files/:fileId/quick-summary", authenticateUser, async (req: any, res) => {
	try {
		const { workspaceId, fileId } = req.params;
		const userId = req.user.userId;

		// Verify workspace ownership
		const workspace = await WorkspaceService.getWorkspaceById(workspaceId, userId);
		if (!workspace) {
			return res.status(404).json({
				success: false,
				message: "Workspace not found",
			});
		}

		// Verify file exists
		const file = await FileService.getFileById(fileId, workspaceId);
		if (!file) {
			return res.status(404).json({
				success: false,
				message: "File not found",
			});
		}

		if (file.status !== "ready") {
			return res.status(400).json({
				success: false,
				message: "File is not ready for summary generation",
			});
		}

		// Generate quick summary
		const quickSummary = await SummaryService.generateQuickSummary(
			fileId,
			file.originalName,
			workspaceId
		);

		res.json({
			success: true,
			summary: quickSummary,
		});

	} catch (error) {
		console.error("Generate quick summary error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to generate quick summary",
			error: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : "Internal server error",
		});
	}
});

/**
 * DELETE /workspaces/:workspaceId/summaries/:summaryId - Delete summary
 */
router.delete("/:workspaceId/summaries/:summaryId", authenticateUser, async (req: any, res) => {
	try {
		const { workspaceId, summaryId } = req.params;
		const userId = req.user.userId;

		// Verify workspace ownership
		const workspace = await WorkspaceService.getWorkspaceById(workspaceId, userId);
		if (!workspace) {
			return res.status(404).json({
				success: false,
				message: "Workspace not found",
			});
		}

		// Delete summary
		await SummaryDbService.deleteSummary(summaryId, workspaceId);

		res.json({
			success: true,
			message: "Summary deleted successfully",
		});

	} catch (error) {
		console.error("Delete summary error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to delete summary",
			error: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : "Internal server error",
		});
	}
});

/**
 * POST /workspaces/:workspaceId/files/:fileId/notes - Create a new personal note
 */
router.post("/:workspaceId/files/:fileId/notes", authenticateUser, async (req: any, res) => {
	try {
		const { workspaceId, fileId } = req.params;
		const { title, content } = req.body;
		const userId = req.user.userId;

		// Verify workspace ownership
		const workspace = await WorkspaceService.getWorkspaceById(workspaceId, userId);
		if (!workspace) {
			return res.status(404).json({ success: false, message: "Workspace not found" });
		}

		// Get file info
		const file = await FileService.getFileById(fileId, workspaceId);
		if (!file) {
			return res.status(404).json({ success: false, message: "File not found" });
		}

		// Create new note
		const note = await NotesService.createNote({
			fileId,
			workspaceId,
			userId,
			title: title || "Personal Note",
			content: content || ""
		});

		res.status(201).json({
			success: true,
			message: "Personal note created successfully",
			note: {
				id: note.id,
				title: note.title,
				content: note.content,
				createdAt: note.createdAt,
				updatedAt: note.updatedAt
			}
		});

	} catch (error) {
		console.error("Error creating personal note:", error);
		res.status(500).json({
			success: false,
			message: "Failed to create personal note",
			error: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : "Internal server error",
		});
	}
});

/**
 * GET /workspaces/:workspaceId/files/:fileId/notes - Get all personal notes for a file
 */
router.get("/:workspaceId/files/:fileId/notes", authenticateUser, async (req: any, res) => {
	try {
		const { workspaceId, fileId } = req.params;
		const userId = req.user.userId;

		// Verify workspace ownership
		const workspace = await WorkspaceService.getWorkspaceById(workspaceId, userId);
		if (!workspace) {
			return res.status(404).json({ success: false, message: "Workspace not found" });
		}

		// Get all notes
		const notes = await NotesService.getNotesByFileId(fileId, workspaceId, userId);

		res.status(200).json({
			success: true,
			notes: notes.map(note => ({
				id: note.id,
				title: note.title,
				content: note.content,
				createdAt: note.createdAt,
				updatedAt: note.updatedAt
			}))
		});

	} catch (error) {
		console.error("Error retrieving personal notes:", error);
		res.status(500).json({
			success: false,
			message: "Failed to retrieve personal notes",
			error: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : "Internal server error",
		});
	}
});

/**
 * PUT /workspaces/:workspaceId/files/:fileId/notes/:noteId - Update a specific personal note
 */
router.put("/:workspaceId/files/:fileId/notes/:noteId", authenticateUser, async (req: any, res) => {
	try {
		const { workspaceId, fileId, noteId } = req.params;
		const { title, content } = req.body;
		const userId = req.user.userId;

		// Verify workspace ownership
		const workspace = await WorkspaceService.getWorkspaceById(workspaceId, userId);
		if (!workspace) {
			return res.status(404).json({ success: false, message: "Workspace not found" });
		}

		// Update note
		const note = await NotesService.updateNote(noteId, {
			title,
			content,
			userId,
			workspaceId
		});

		if (!note) {
			return res.status(404).json({ success: false, message: "Note not found" });
		}

		res.status(200).json({
			success: true,
			message: "Personal note updated successfully",
			note: {
				id: note.id,
				title: note.title,
				content: note.content,
				createdAt: note.createdAt,
				updatedAt: note.updatedAt
			}
		});

	} catch (error) {
		console.error("Error updating personal note:", error);
		res.status(500).json({
			success: false,
			message: "Failed to update personal note",
			error: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : "Internal server error",
		});
	}
});

/**
 * DELETE /workspaces/:workspaceId/files/:fileId/notes/:noteId - Delete a specific personal note
 */
router.delete("/:workspaceId/files/:fileId/notes/:noteId", authenticateUser, async (req: any, res) => {
	try {
		const { workspaceId, noteId } = req.params;
		const userId = req.user.userId;

		// Verify workspace ownership
		const workspace = await WorkspaceService.getWorkspaceById(workspaceId, userId);
		if (!workspace) {
			return res.status(404).json({ success: false, message: "Workspace not found" });
		}

		// Delete note
		await NotesService.deleteNote(noteId, userId, workspaceId);

		res.status(200).json({
			success: true,
			message: "Personal note deleted successfully"
		});

	} catch (error) {
		console.error("Error deleting personal note:", error);
		res.status(500).json({
			success: false,
			message: "Failed to delete personal note",
			error: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : "Internal server error",
		});
	}
});

export default router;
