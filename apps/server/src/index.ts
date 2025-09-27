import "dotenv/config";
import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth.js";

const app = express();

app.use(
	cors({
		origin: process.env.CORS_ORIGIN || "http://localhost:3001",
		methods: ["GET", "POST", "OPTIONS"],
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

const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`🚀 Sozi API Server is running on port ${port}`);

});
