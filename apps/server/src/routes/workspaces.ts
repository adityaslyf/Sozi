import { Router } from "express";
import { WorkspaceService } from "../services/workspaceService.js";
import { JWTService } from "../services/jwtService.js";
import { FileService } from "../services/fileService.js";
import { NotesService } from "../services/notesService.js";
import { SummaryDbService } from "../services/summaryDbService.js";
import { MCQDbService } from "../services/mcqDbService.js";

const router = Router();

/**
 * Middleware to authenticate user and extract userId from JWT
 */
const authenticateUser = (req: any, res: any, next: any) => {
	try {
		const authHeader = req.headers.authorization;
		
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({
				success: false,
				message: "Authorization token required",
			});
		}

		const token = authHeader.substring(7); // Remove "Bearer " prefix
		const payload = JWTService.verifyToken(token);
		
		// Add user info to request object
		req.user = payload;
		next();
	} catch (error) {
		console.error("Authentication error:", error);
		
		res.status(401).json({
			success: false,
			message: "Invalid or expired token",
		});
	}
};

/**
 * POST /workspaces - Create a new workspace
 */
router.post("/", authenticateUser, async (req: any, res) => {
	try {
		const { name, description } = req.body;
		const userId = req.user.userId;

		// Validate required fields
		if (!name || name.trim().length === 0) {
			return res.status(400).json({
				success: false,
				message: "Workspace name is required",
			});
		}

		if (name.length > 255) {
			return res.status(400).json({
				success: false,
				message: "Workspace name must be 255 characters or less",
			});
		}

		if (description && description.length > 500) {
			return res.status(400).json({
				success: false,
				message: "Description must be 500 characters or less",
			});
		}

		// Create workspace
		const workspace = await WorkspaceService.createWorkspace({
			userId,
			name: name.trim(),
			description: description?.trim() || null,
		});

		res.status(201).json({
			success: true,
			message: "Workspace created successfully",
			workspace,
		});

	} catch (error) {
		console.error("Create workspace error:", error);
		
		res.status(500).json({
			success: false,
			message: "Failed to create workspace",
			error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
		});
	}
});

/**
 * GET /workspaces - Get all workspaces for the authenticated user
 */
router.get("/", authenticateUser, async (req: any, res) => {
	try {
		const userId = req.user.userId;
		
		const workspaces = await WorkspaceService.getUserWorkspaces(userId);
		
		res.json({
			success: true,
			workspaces,
			count: workspaces.length,
		});

	} catch (error) {
		console.error("Get workspaces error:", error);
		
		res.status(500).json({
			success: false,
			message: "Failed to fetch workspaces",
			error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
		});
	}
});

/**
 * GET /workspaces/:id - Get a specific workspace
 */
router.get("/:id", authenticateUser, async (req: any, res) => {
	try {
		const { id } = req.params;
		const userId = req.user.userId;
		
		const workspace = await WorkspaceService.getWorkspaceById(id, userId);
		
		if (!workspace) {
			return res.status(404).json({
				success: false,
				message: "Workspace not found",
			});
		}
		
		res.json({
			success: true,
			workspace,
		});

	} catch (error) {
		console.error("Get workspace error:", error);
		
		res.status(500).json({
			success: false,
			message: "Failed to fetch workspace",
			error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
		});
	}
});

/**
 * PUT /workspaces/:id - Update a workspace
 */
router.put("/:id", authenticateUser, async (req: any, res) => {
	try {
		const { id } = req.params;
		const { name, description } = req.body;
		const userId = req.user.userId;

		// Validate fields if provided
		if (name !== undefined) {
			if (!name || name.trim().length === 0) {
				return res.status(400).json({
					success: false,
					message: "Workspace name cannot be empty",
				});
			}

			if (name.length > 255) {
				return res.status(400).json({
					success: false,
					message: "Workspace name must be 255 characters or less",
				});
			}
		}

		if (description !== undefined && description && description.length > 500) {
			return res.status(400).json({
				success: false,
				message: "Description must be 500 characters or less",
			});
		}

		// Update workspace
		const updateData: any = {};
		if (name !== undefined) updateData.name = name.trim();
		if (description !== undefined) updateData.description = description?.trim() || null;

		const workspace = await WorkspaceService.updateWorkspace(id, userId, updateData);
		
		if (!workspace) {
			return res.status(404).json({
				success: false,
				message: "Workspace not found",
			});
		}
		
		res.json({
			success: true,
			message: "Workspace updated successfully",
			workspace,
		});

	} catch (error) {
		console.error("Update workspace error:", error);
		
		res.status(500).json({
			success: false,
			message: "Failed to update workspace",
			error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
		});
	}
});

/**
 * DELETE /workspaces/:id - Delete a workspace
 */
router.delete("/:id", authenticateUser, async (req: any, res) => {
	try {
		const { id } = req.params;
		const userId = req.user.userId;
		
		const deleted = await WorkspaceService.deleteWorkspace(id, userId);
		
		if (!deleted) {
			return res.status(404).json({
				success: false,
				message: "Workspace not found",
			});
		}
		
		res.json({
			success: true,
			message: "Workspace deleted successfully",
		});

	} catch (error) {
		console.error("Delete workspace error:", error);
		
		res.status(500).json({
			success: false,
			message: "Failed to delete workspace",
			error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
		});
	}
});

export default router;

/**
 * GET /workspaces/:id/analytics - Get aggregated analytics for a workspace
 */
router.get("/:id/analytics", authenticateUser, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Verify workspace ownership
    const workspace = await WorkspaceService.getWorkspaceById(id, userId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    // Parallel fetches
    const [
      filesCountPromise,
      summariesPromise,
      notesPromise,
      mcqSessionsPromise,
    ] = [
      FileService.getWorkspaceFileCount(id),
      SummaryDbService.getWorkspaceSummaries(id),
      NotesService.getNotesByWorkspace(id, userId),
      MCQDbService.getMCQSessionsByWorkspaceId(id, userId),
    ];

    const [filesCount, summaries, notes, mcqSessions] = await Promise.all([
      filesCountPromise,
      summariesPromise,
      notesPromise,
      mcqSessionsPromise,
    ]);

    // MCQ stats derived from attempts across sessions
    const attemptsArrays = await Promise.all(
      mcqSessions.map((s) => MCQDbService.getAttemptsBySessionId(s.id, userId))
    );
    const allAttempts = attemptsArrays.flat();

    const totalExercises = mcqSessions.reduce(
      (sum, s) => sum + (s.totalQuestions || 0),
      0
    );

    const totalAttempts = allAttempts.length;
    const averagePercentage = totalAttempts
      ? Math.round(
          (allAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) /
            totalAttempts) * 100
        ) / 100
      : 0;
    const bestPercentage = totalAttempts
      ? Math.max(...allAttempts.map((a) => a.percentage || 0))
      : 0;

    res.json({
      success: true,
      analytics: {
        files: filesCount,
        summaries: summaries.length,
        notes: notes.length,
        mcqSessions: mcqSessions.length,
        exercises: totalExercises,
        score: {
          averagePercentage,
          bestPercentage,
          attempts: totalAttempts,
        },
      },
    });
  } catch (error) {
    console.error("Get workspace analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Internal server error",
    });
  }
});
