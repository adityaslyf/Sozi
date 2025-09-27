import express from "express";
import jwt from "jsonwebtoken";
import { MCQService } from "../services/mcqService.js";
import { MCQDbService } from "../services/mcqDbService.js";
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
		const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any;
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
 * POST /workspaces/:workspaceId/files/:fileId/mcq/generate - Generate MCQ questions
 */
router.post("/:workspaceId/files/:fileId/mcq/generate", authenticateUser, async (req: any, res) => {
	try {
		const { workspaceId, fileId } = req.params;
		const { difficulty = 'Medium', numberOfQuestions = 10, focus = 'All topics' } = req.body;
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

		// Check if file is ready (has been processed)
		if (file.status !== 'ready') {
			return res.status(400).json({ 
				success: false, 
				message: "File is not ready for MCQ generation. Please wait for processing to complete." 
			});
		}

		// Validate input parameters
		const validDifficulties = ['Easy', 'Medium', 'Hard'];
		if (!validDifficulties.includes(difficulty)) {
			return res.status(400).json({ 
				success: false, 
				message: "Invalid difficulty. Must be Easy, Medium, or Hard." 
			});
		}

		if (numberOfQuestions < 1 || numberOfQuestions > 50) {
			return res.status(400).json({ 
				success: false, 
				message: "Number of questions must be between 1 and 50." 
			});
		}

		// Generate MCQs
		const mcqs = await MCQService.generateMCQs({
			fileId,
			workspaceId,
			difficulty,
			numberOfQuestions: parseInt(numberOfQuestions),
			focus
		});

		// Save MCQ session to database
		const sessionData = await MCQDbService.createMCQSession(
			{
				fileId,
				workspaceId,
				userId,
				title: `${file.name} - ${difficulty} MCQs`,
				difficulty,
				focus,
				sessionMode: 'Practice Mode', // Default for now
			},
			mcqs.map(mcq => ({
				question: mcq.question,
				options: mcq.options,
				explanation: mcq.explanation,
				difficulty: mcq.difficulty,
				topic: mcq.topic,
				context: mcq.context,
			}))
		);

		res.status(200).json({
			success: true,
			message: "MCQs generated and saved successfully",
			sessionId: sessionData.session.id,
			mcqs,
			metadata: {
				fileId,
				fileName: file.name,
				difficulty,
				numberOfQuestions: mcqs.length,
				focus,
				generatedAt: new Date().toISOString()
			}
		});

	} catch (error) {
		console.error("Error generating MCQs:", error);
		res.status(500).json({
			success: false,
			message: "Failed to generate MCQs",
			error: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : "Internal server error",
		});
	}
});

/**
 * GET /workspaces/:workspaceId/files/:fileId/mcq/sessions - Get all MCQ sessions for a file
 */
router.get("/:workspaceId/files/:fileId/mcq/sessions", authenticateUser, async (req: any, res) => {
	try {
		const { workspaceId, fileId } = req.params;
		const userId = req.user.userId;

		// Verify workspace ownership
		const workspace = await WorkspaceService.getWorkspaceById(workspaceId, userId);
		if (!workspace) {
			return res.status(404).json({ success: false, message: "Workspace not found" });
		}

		// Get MCQ sessions
		const sessions = await MCQDbService.getMCQSessionsByFileId(fileId, userId);

		res.status(200).json({
			success: true,
			sessions
		});

	} catch (error) {
		console.error("Error getting MCQ sessions:", error);
		res.status(500).json({
			success: false,
			message: "Failed to get MCQ sessions",
			error: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : "Internal server error",
		});
	}
});

/**
 * GET /workspaces/:workspaceId/files/:fileId/mcq/sessions/:sessionId - Get specific MCQ session
 */
router.get("/:workspaceId/files/:fileId/mcq/sessions/:sessionId", authenticateUser, async (req: any, res) => {
	try {
		const { workspaceId, sessionId } = req.params;
		const userId = req.user.userId;

		// Verify workspace ownership
		const workspace = await WorkspaceService.getWorkspaceById(workspaceId, userId);
		if (!workspace) {
			return res.status(404).json({ success: false, message: "Workspace not found" });
		}

		// Get MCQ session with questions
		const sessionData = await MCQDbService.getMCQSessionById(sessionId, userId);
		if (!sessionData) {
			return res.status(404).json({ success: false, message: "MCQ session not found" });
		}

		// Get session statistics
		const statistics = await MCQDbService.getSessionStatistics(sessionId, userId);

		res.status(200).json({
			success: true,
			session: sessionData.session,
			questions: sessionData.questions,
			statistics
		});

	} catch (error) {
		console.error("Error getting MCQ session:", error);
		res.status(500).json({
			success: false,
			message: "Failed to get MCQ session",
			error: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : "Internal server error",
		});
	}
});

/**
 * POST /workspaces/:workspaceId/files/:fileId/mcq/sessions/:sessionId/attempt - Submit MCQ attempt
 */
router.post("/:workspaceId/files/:fileId/mcq/sessions/:sessionId/attempt", authenticateUser, async (req: any, res) => {
	try {
		const { workspaceId, sessionId } = req.params;
		const { answers, timeSpent } = req.body;
		const userId = req.user.userId;

		// Verify workspace ownership
		const workspace = await WorkspaceService.getWorkspaceById(workspaceId, userId);
		if (!workspace) {
			return res.status(404).json({ success: false, message: "Workspace not found" });
		}

		// Get session and questions
		const sessionData = await MCQDbService.getMCQSessionById(sessionId, userId);
		if (!sessionData) {
			return res.status(404).json({ success: false, message: "MCQ session not found" });
		}

		// Validate answers and calculate score
		let correctCount = 0;
		const validatedAnswers = answers.map((answer: any) => {
			const question = sessionData.questions.find(q => q.id === answer.questionId);
			if (!question) {
				return { ...answer, isCorrect: false };
			}

			const selectedOption = question.options.find((opt: any) => opt.id === answer.selectedOptionId);
			const isCorrect = selectedOption?.isCorrect || false;
			
			if (isCorrect) correctCount++;

			return {
				questionId: answer.questionId,
				selectedOptionId: answer.selectedOptionId,
				isCorrect,
				timeSpent: answer.timeSpent || 0
			};
		});

		const totalQuestions = sessionData.questions.length;
		const percentage = Math.round((correctCount / totalQuestions) * 100);

		// Save attempt to database
		const attempt = await MCQDbService.saveMCQAttempt({
			sessionId,
			userId,
			score: correctCount,
			totalQuestions,
			percentage,
			timeSpent: timeSpent || 0,
			answers: validatedAnswers
		});

		res.status(200).json({
			success: true,
			message: "MCQ attempt saved successfully",
			attempt: {
				id: attempt.id,
				score: correctCount,
				totalQuestions,
				percentage,
				timeSpent: timeSpent || 0,
				answers: validatedAnswers,
				completedAt: attempt.completedAt
			}
		});

	} catch (error) {
		console.error("Error saving MCQ attempt:", error);
		res.status(500).json({
			success: false,
			message: "Failed to save MCQ attempt",
			error: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : "Internal server error",
		});
	}
});

/**
 * DELETE /workspaces/:workspaceId/files/:fileId/mcq/sessions/:sessionId - Delete MCQ session
 */
router.delete("/:workspaceId/files/:fileId/mcq/sessions/:sessionId", authenticateUser, async (req: any, res) => {
	try {
		const { workspaceId, sessionId } = req.params;
		const userId = req.user.userId;

		// Verify workspace ownership
		const workspace = await WorkspaceService.getWorkspaceById(workspaceId, userId);
		if (!workspace) {
			return res.status(404).json({ success: false, message: "Workspace not found" });
		}

		// Delete MCQ session
		await MCQDbService.deleteMCQSession(sessionId, userId);

		res.status(200).json({
			success: true,
			message: "MCQ session deleted successfully"
		});

	} catch (error) {
		console.error("Error deleting MCQ session:", error);
		res.status(500).json({
			success: false,
			message: "Failed to delete MCQ session",
			error: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : "Internal server error",
		});
	}
});

/**
 * POST /workspaces/:workspaceId/files/:fileId/mcq/validate - Validate MCQ answers (Legacy endpoint)
 */
router.post("/:workspaceId/files/:fileId/mcq/validate", authenticateUser, async (req: any, res) => {
	try {
		const { workspaceId, fileId } = req.params;
		const { answers } = req.body; // Array of {questionId, selectedOptionId}
		const userId = req.user.userId;

		// Verify workspace ownership
		const workspace = await WorkspaceService.getWorkspaceById(workspaceId, userId);
		if (!workspace) {
			return res.status(404).json({ success: false, message: "Workspace not found" });
		}

		// Validate answers format
		if (!Array.isArray(answers)) {
			return res.status(400).json({ 
				success: false, 
				message: "Answers must be an array of {questionId, selectedOptionId}" 
			});
		}

		// For now, return a placeholder response
		// In a full implementation, you'd store the original MCQs and validate against them
		const results = answers.map(answer => ({
			questionId: answer.questionId,
			selectedOptionId: answer.selectedOptionId,
			isCorrect: Math.random() > 0.5, // Placeholder - replace with actual validation
			correctOptionId: "A", // Placeholder
			explanation: "This is a placeholder explanation." // Placeholder
		}));

		const score = results.filter(r => r.isCorrect).length;
		const totalQuestions = results.length;
		const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

		res.status(200).json({
			success: true,
			message: "Answers validated successfully",
			results: {
				score,
				totalQuestions,
				percentage,
				answers: results,
				completedAt: new Date().toISOString()
			}
		});

	} catch (error) {
		console.error("Error validating MCQ answers:", error);
		res.status(500).json({
			success: false,
			message: "Failed to validate answers",
			error: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : "Internal server error",
		});
	}
});

export default router;
