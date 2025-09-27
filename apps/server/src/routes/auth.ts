import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import { UserService } from "../services/userService.js";
import { JWTService } from "../services/jwtService.js";

const router = Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Google OAuth authentication endpoint
 */
router.post("/google", async (req, res) => {
	try {
		const { token, userInfo } = req.body;

		if (!token) {
			return res.status(400).json({
				success: false,
				message: "Google token is required",
			});
		}

		// Verify the Google token
		const ticket = await googleClient.verifyIdToken({
			idToken: token,
			audience: process.env.GOOGLE_CLIENT_ID,
		});

		const payload = ticket.getPayload();
		
		if (!payload) {
			return res.status(400).json({
				success: false,
				message: "Invalid Google token",
			});
		}

		// Extract user data from Google token
		const googleUserData = {
			googleId: payload.sub,
			email: payload.email!,
			name: payload.name,
			picture: payload.picture,
		};

		// Create or update user in database
		const user = await UserService.createOrUpdateFromGoogle(googleUserData);

		// Generate JWT tokens
		const accessToken = JWTService.generateToken(user);
		const refreshToken = JWTService.generateRefreshToken(user);

		// Return success response
		res.json({
			success: true,
			message: "Authentication successful",
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				profileImageUrl: user.profileImageUrl,
				role: user.role,
			},
			tokens: {
				accessToken,
				refreshToken,
			},
		});

	} catch (error) {
		console.error("Google OAuth error:", error);
		
		res.status(500).json({
			success: false,
			message: "Authentication failed",
			error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
		});
	}
});

/**
 * Token refresh endpoint
 */
router.post("/refresh", async (req, res) => {
	try {
		const { refreshToken } = req.body;

		if (!refreshToken) {
			return res.status(400).json({
				success: false,
				message: "Refresh token is required",
			});
		}

		// Verify refresh token
		const payload = JWTService.verifyToken(refreshToken);
		
		// Find user
		const user = await UserService.findByEmail(payload.email);
		
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		// Generate new tokens
		const newAccessToken = JWTService.generateToken(user);
		const newRefreshToken = JWTService.generateRefreshToken(user);

		res.json({
			success: true,
			tokens: {
				accessToken: newAccessToken,
				refreshToken: newRefreshToken,
			},
		});

	} catch (error) {
		console.error("Token refresh error:", error);
		
		res.status(401).json({
			success: false,
			message: "Invalid refresh token",
		});
	}
});

/**
 * Get current user profile
 */
router.get("/me", async (req, res) => {
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
		
		// Find user
		const user = await UserService.findByEmail(payload.email);
		
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		res.json({
			success: true,
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				profileImageUrl: user.profileImageUrl,
				role: user.role,
				preferences: user.preferences,
				progress: user.progress,
				createdAt: user.createdAt,
				lastLogin: user.lastLogin,
			},
		});

	} catch (error) {
		console.error("Get user profile error:", error);
		
		res.status(401).json({
			success: false,
			message: "Invalid or expired token",
		});
	}
});

export default router;
