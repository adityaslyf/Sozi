import { pgTable, uuid, varchar, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	email: varchar("email", { length: 255 }).unique().notNull(),
	googleId: varchar("google_id", { length: 255 }).unique().notNull(),
	name: varchar("name", { length: 255 }),
	profileImageUrl: text("profile_image_url"),
	role: varchar("role", { length: 50 }).default("student"),
	preferences: jsonb("preferences").default({}),
	progress: jsonb("progress").default({}),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
	lastLogin: timestamp("last_login"),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

