import jwt from "jsonwebtoken";
import type { User } from "../db/schema/users.js";

const JWT_SECRET = process.env.JWT_SECRET || "";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface JWTPayload {
	userId: string;
	email: string;
	role: string;
	iat?: number;
	exp?: number;
}

export class JWTService {
	/**
	 * Generate JWT token for user
	 */
	static generateToken(user: User): string {
		const payload: JWTPayload = {
			userId: user.id,
			email: user.email,
			role: user.role || "student",
		};

		return jwt.sign(payload, JWT_SECRET, {
			expiresIn: JWT_EXPIRES_IN,
		});
	}

	/**
	 * Verify and decode JWT token
	 */
	static verifyToken(token: string): JWTPayload {
		try {
			return jwt.verify(token, JWT_SECRET) as JWTPayload;
		} catch (error) {
			throw new Error("Invalid or expired token");
		}
	}

	/**
	 * Generate refresh token (longer expiry)
	 */
	static generateRefreshToken(user: User): string {
		const payload: JWTPayload = {
			userId: user.id,
			email: user.email,
			role: user.role || "student",
		};

		return jwt.sign(payload, JWT_SECRET, {
			expiresIn: "30d", // Refresh tokens last longer
		});
	}
}
