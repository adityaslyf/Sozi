import "dotenv/config";
import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth.js";
import workspaceRoutes from "./routes/workspaces.js";
import fileRoutes from "./routes/files.js";
import { DocumentService } from "./services/documentService.js";

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

const port = process.env.PORT || 3000;

// Initialize DocumentService with NVIDIA embeddings
async function initializeServer() {
	try {
		await DocumentService.initialize();
		console.log("✅ DocumentService initialized successfully");
	} catch (error) {
		console.error("❌ Failed to initialize DocumentService:", error);
		console.log("⚠️ Server will continue but document processing will be disabled");
	}
}

app.listen(port, async () => {
	console.log(`🚀 Sozi API Server is running on port ${port}`);
	console.log(`📍 Health check: http://localhost:${port}`);
	console.log(`🔐 Auth endpoint: http://localhost:${port}/auth`);
	console.log(`📁 Workspaces endpoint: http://localhost:${port}/workspaces`);
	console.log(`📄 File upload endpoint: http://localhost:${port}/workspaces/:id/files`);
	
	// Initialize document service
	await initializeServer();
});
