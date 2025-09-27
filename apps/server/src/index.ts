import "dotenv/config";
import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth.js";
import workspaceRoutes from "./routes/workspaces.js";
import fileRoutes from "./routes/files.js";
import summaryRoutes from "./routes/summaries.js";
import { DocumentService } from "./services/documentService.js";
import { SummaryService } from "./services/summaryService.js";

const app = express();

app.use(
	cors({
		origin: process.env.CORS_ORIGIN || "http://localhost:3001",
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		credentials: true,
	}),
);

app.use(express.json());

// Health check endpoint
app.get("/", (_req, res) => {
	res.status(200).json({ 
		status: "OK", 
		message: "Sozi API Server is running",
		timestamp: new Date().toISOString()
	});
});

// Authentication routes
app.use("/auth", authRoutes);

// Workspace routes
app.use("/workspaces", workspaceRoutes);

// File routes (nested under workspaces)
app.use("/workspaces", fileRoutes);

// Summary routes (nested under workspaces)
app.use("/workspaces", summaryRoutes);

const port = process.env.PORT || 3000;

// Initialize services
async function initializeServer() {
	try {
		await DocumentService.initialize();
		console.log("✅ DocumentService initialized successfully");
		
		await SummaryService.initialize();
		console.log("✅ SummaryService initialized successfully");
	} catch (error) {
		console.error("❌ Failed to initialize services:", error);
		console.log("⚠️ Server will continue but some features may be disabled");
	}
}

app.listen(port, async () => {
	console.log(`🚀 Sozi API Server is running on port ${port}`);
	console.log(`📍 Health check: http://localhost:${port}`);
	console.log(`🔐 Auth endpoint: http://localhost:${port}/auth`);
	console.log(`📁 Workspaces endpoint: http://localhost:${port}/workspaces`);
	console.log(`📄 File upload endpoint: http://localhost:${port}/workspaces/:id/files`);
	console.log(`📝 Summary endpoint: http://localhost:${port}/workspaces/:id/files/:fileId/summary`);
	
	// Initialize document service
	await initializeServer();
});
