import express from "express";
import jwt from "jsonwebtoken";
import { SummaryService } from "../services/summaryService.js";
import { SummaryDbService } from "../services/summaryDbService.js";
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
 * POST /workspaces/:workspaceId/files/:fileId/summary - Generate golden summary
 */
router.post("/:workspaceId/files/:fileId/summary", authenticateUser, async (req: any, res) => {
	try {
		const { workspaceId, fileId } = req.params;
		const userId = req.user.userId;
		const { type = "golden", regenerate = false } = req.body;

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

export default router;
