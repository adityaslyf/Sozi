import { db } from "../db/index.js";
import { users, type User, type NewUser } from "../db/schema/users.js";
import { eq } from "drizzle-orm";

export class UserService {
	/**
	 * Find user by Google ID
	 */
	static async findByGoogleId(googleId: string): Promise<User | null> {
		const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
		return result[0] || null;
	}

	/**
	 * Find user by email
	 */
	static async findByEmail(email: string): Promise<User | null> {
		const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
		return result[0] || null;
	}

	/**
	 * Create a new user
	 */
	static async createUser(userData: NewUser): Promise<User> {
		const result = await db.insert(users).values({
			...userData,
			createdAt: new Date(),
			updatedAt: new Date(),
			lastLogin: new Date(),
		}).returning();
		
		return result[0];
	}

	/**
	 * Update user's last login time
	 */
	static async updateLastLogin(userId: string): Promise<void> {
		await db.update(users)
			.set({ 
				lastLogin: new Date(),
				updatedAt: new Date()
			})
			.where(eq(users.id, userId));
	}

	/**
	 * Create or update user from Google OAuth data
	 */
	static async createOrUpdateFromGoogle(googleUserData: {
		googleId: string;
		email: string;
		name?: string;
		picture?: string;
	}): Promise<User> {
		// Check if user exists by Google ID
		let existingUser = await this.findByGoogleId(googleUserData.googleId);
		
		if (existingUser) {
			// Update last login
			await this.updateLastLogin(existingUser.id);
			return existingUser;
		}

		// Check if user exists by email (in case they signed up differently before)
		existingUser = await this.findByEmail(googleUserData.email);
		
		if (existingUser) {
			// Update the existing user with Google ID and update last login
			const result = await db.update(users)
				.set({
					googleId: googleUserData.googleId,
					name: googleUserData.name || existingUser.name,
					profileImageUrl: googleUserData.picture || existingUser.profileImageUrl,
					lastLogin: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(users.id, existingUser.id))
				.returning();
			
			return result[0];
		}

		// Create new user
		return this.createUser({
			googleId: googleUserData.googleId,
			email: googleUserData.email,
			name: googleUserData.name,
			profileImageUrl: googleUserData.picture,
			role: "student",
			preferences: {},
			progress: {},
		});
	}
}
