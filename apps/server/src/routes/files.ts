import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs-extra";
import { FileService } from "../services/fileService.js";
import { DocumentService } from "../services/documentService.js";
import { WorkspaceService } from "../services/workspaceService.js";
import { JWTService } from "../services/jwtService.js";

const router = Router();

// Configure multer for file uploads
const uploadDir = process.env.UPLOAD_DIR || "./uploads";
fs.ensureDirSync(uploadDir);

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadDir);
	},
	filename: (req, file, cb) => {
		// Generate unique filename with timestamp
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
		const ext = path.extname(file.originalname);
		cb(null, file.fieldname + "-" + uniqueSuffix + ext);
	},
});

const upload = multer({
	storage,
	limits: {
		fileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760"), // 10MB default
	},
	fileFilter: (req, file, cb) => {
		// Only allow PDF and DOCX files
		const allowedMimeTypes = [
			"application/pdf",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		];
		
		if (allowedMimeTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error("Only PDF and DOCX files are allowed"));
		}
	},
});

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

		const token = authHeader.substring(7);
		const payload = JWTService.verifyToken(token);
		
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
 * POST /workspaces/:workspaceId/files - Upload file to workspace
 */
router.post("/:workspaceId/files", authenticateUser, upload.single("file"), async (req: any, res) => {
	try {
		const { workspaceId } = req.params;
		const userId = req.user.userId;
		const file = req.file;

		if (!file) {
			return res.status(400).json({
				success: false,
				message: "No file uploaded",
			});
		}

		// Verify workspace ownership
		const workspace = await WorkspaceService.getWorkspaceById(workspaceId, userId);
		if (!workspace) {
			// Clean up uploaded file
			await fs.remove(file.path);
			return res.status(404).json({
				success: false,
				message: "Workspace not found",
			});
		}

		// Create file record in database
		const fileRecord = await FileService.createFile({
			workspaceId,
			name: file.filename,
			originalName: file.originalname,
			url: file.path,
			size: file.size.toString(),
			mimeType: file.mimetype,
			status: "uploaded",
		});

		// Start document processing in background (don't await to avoid timeout)
		processDocumentAsync(fileRecord.id, workspaceId, file.path, file.originalname, file.mimetype)
			.catch(error => {
				console.error(`Background processing failed for ${file.originalname}:`, error);
			});

		res.status(201).json({
			success: true,
			message: "File uploaded successfully",
			file: {
				id: fileRecord.id,
				name: fileRecord.originalName,
				size: fileRecord.size,
				status: fileRecord.status,
				createdAt: fileRecord.createdAt,
			},
		});

	} catch (error) {
		console.error("File upload error:", error);
		
		// Clean up uploaded file if it exists
		if (req.file) {
			await fs.remove(req.file.path).catch(console.error);
		}
		
		res.status(500).json({
			success: false,
			message: "Failed to upload file",
			error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
		});
	}
});

/**
 * GET /workspaces/:workspaceId/files - Get all files in workspace
 */
router.get("/:workspaceId/files", authenticateUser, async (req: any, res) => {
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

		const files = await FileService.getWorkspaceFiles(workspaceId);
		
		// Format response
		const formattedFiles = files.map(file => ({
			id: file.id,
			name: file.originalName,
			size: file.size,
			status: file.status,
			createdAt: file.createdAt,
			updatedAt: file.updatedAt,
		}));

		res.json({
			success: true,
			files: formattedFiles,
			count: formattedFiles.length,
		});

	} catch (error) {
		console.error("Get files error:", error);
		
		res.status(500).json({
			success: false,
			message: "Failed to fetch files",
			error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
		});
	}
});

/**
 * DELETE /workspaces/:workspaceId/files/:fileId - Delete file
 */
router.delete("/:workspaceId/files/:fileId", authenticateUser, async (req: any, res) => {
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

		// Get file record
		const file = await FileService.getFileById(fileId, workspaceId);
		if (!file) {
			return res.status(404).json({
				success: false,
				message: "File not found",
			});
		}

		// Delete from Pinecone
		await DocumentService.deleteDocumentFromPinecone(fileId, workspaceId);

		// Delete physical file
		await fs.remove(file.url).catch(console.error);

		// Delete from database
		await FileService.deleteFile(fileId, workspaceId);

		res.json({
			success: true,
			message: "File deleted successfully",
		});

	} catch (error) {
		console.error("Delete file error:", error);
		
		res.status(500).json({
			success: false,
			message: "Failed to delete file",
			error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
		});
	}
});

/**
 * GET /workspaces/:workspaceId/debug/chunks - Debug: Inspect stored chunks
 */
router.get("/:workspaceId/debug/chunks", authenticateUser, async (req: any, res) => {
	try {
		const { workspaceId } = req.params;
		const userId = req.user.userId;
		const limit = parseInt(req.query.limit as string) || 10;

		// Verify workspace ownership
		const workspace = await WorkspaceService.getWorkspaceById(workspaceId, userId);
		if (!workspace) {
			return res.status(404).json({
				success: false,
				message: "Workspace not found",
			});
		}

		// Inspect stored chunks
		const chunks = await DocumentService.inspectStoredChunks(workspaceId, limit);
		
		res.json({
			success: true,
			workspaceId,
			chunkCount: chunks.length,
			chunks: chunks.map(chunk => ({
				id: chunk.id,
				score: chunk.score,
				metadata: chunk.metadata,
				contentPreview: chunk.metadata?.text ? 
					String(chunk.metadata.text).substring(0, 300) + "..." : 
					"No text content found"
			}))
		});

	} catch (error) {
		console.error("Debug chunks error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to inspect chunks",
			error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
		});
	}
});

/**
 * GET /workspaces/:workspaceId/debug/search-quality - Debug: Test search quality
 */
router.get("/:workspaceId/debug/search-quality", authenticateUser, async (req: any, res) => {
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

		// Test search quality
		const testResults = await DocumentService.testSearchQuality(workspaceId);
		
		res.json({
			success: true,
			workspaceId,
			testResults
		});

	} catch (error) {
		console.error("Debug search quality error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to test search quality",
			error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
		});
	}
});

/**
 * POST /workspaces/:workspaceId/search - Search documents
 */
router.post("/:workspaceId/search", authenticateUser, async (req: any, res) => {
	try {
		const { workspaceId } = req.params;
		const { query, limit = 5 } = req.body;
		const userId = req.user.userId;

		console.log(`🔍 Search request: "${query}" in workspace ${workspaceId}`);

		if (!query || query.trim().length === 0) {
			return res.status(400).json({
				success: false,
				message: "Search query is required",
			});
		}

		// Verify workspace ownership
		const workspace = await WorkspaceService.getWorkspaceById(workspaceId, userId);
		if (!workspace) {
			return res.status(404).json({
				success: false,
				message: "Workspace not found",
			});
		}

		const results = await DocumentService.searchSimilarDocuments(query, workspaceId, limit);

		console.log(`✅ Search completed: found ${results.length} results`);

		res.json({
			success: true,
			query,
			results: results.map(result => ({
				content: result.pageContent,
				metadata: result.metadata,
				score: result.score || 0, // Include similarity score if available
			})),
			count: results.length,
		});

	} catch (error) {
		console.error("Search error:", error);
		
		res.status(500).json({
			success: false,
			message: "Failed to search documents",
			error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
		});
	}
});

/**
 * Background document processing
 */
async function processDocumentAsync(
	fileId: string,
	workspaceId: string,
	filePath: string,
	fileName: string,
	_mimeType: string
) {
	try {
		// Update status to processing
		await FileService.updateFileStatus(fileId, "processing");

		// Process document with Gemini embeddings (with dynamic timeout based on file size)
		const stats = await fs.stat(filePath);
		const fileSizeMB = stats.size / (1024 * 1024);
		
		// Dynamic timeout based on estimated processing time
		// For 186 chunks: ~13 batches × 3s per batch + 12 × 2s delays = ~63s processing time
		// Add significant buffer for network delays and API rate limits
		const estimatedChunks = Math.ceil(fileSizeMB * 100); // Rough estimate: 100 chunks per MB
		const estimatedBatches = Math.ceil(estimatedChunks / 10); // 10 chunks per batch
		const estimatedProcessingMs = (estimatedBatches * 5000) + ((estimatedBatches - 1) * 2000); // 5s per batch + 2s delays
		
		// Add generous buffer: 5 minutes base + estimated time + 50% buffer
		const baseTimeoutMs = 5 * 60 * 1000; // 5 minutes base
		const bufferMultiplier = 1.5; // 50% buffer
		const maxTimeoutMs = 30 * 60 * 1000; // 30 minutes max
		const timeoutMs = Math.min(baseTimeoutMs + (estimatedProcessingMs * bufferMultiplier), maxTimeoutMs);
		
		console.log(`⏰ Starting document processing for ${fileName} (${fileSizeMB.toFixed(2)} MB)`);
		console.log(`⏰ Timeout set to ${Math.round(timeoutMs/1000)}s (${Math.round(timeoutMs/60000)} minutes)`);
		
		await Promise.race([
			DocumentService.processDocument(filePath, fileName, fileId, workspaceId),
			new Promise((_, reject) => 
				setTimeout(() => reject(new Error(`Processing timeout after ${timeoutMs/1000}s`)), timeoutMs)
			)
		]);

		// Update status to ready
		await FileService.updateFileStatus(fileId, "ready");

		console.log(`✅ Document processing completed for ${fileName}`);
	} catch (error) {
		console.error(`❌ Document processing failed for ${fileName}:`, error);
		
		// Update status to error
		await FileService.updateFileStatus(fileId, "error");
	}
}

export default router;

