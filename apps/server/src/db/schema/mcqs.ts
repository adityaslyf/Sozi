import { pgTable, uuid, varchar, text, jsonb, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { files } from "./files";
import { workspaces } from "./workspaces";
import { users } from "./users";

// MCQ Sessions table - stores generated MCQ sessions
export const mcqSessions = pgTable("mcq_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  fileId: uuid("file_id").references(() => files.id, { onDelete: "cascade" }).notNull(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).default("MCQ Session").notNull(),
  difficulty: varchar("difficulty", { length: 20 }).notNull(), // 'Easy', 'Medium', 'Hard'
  focus: varchar("focus", { length: 50 }).notNull(), // 'Tailored for me', 'All topics', 'Weak areas'
  sessionMode: varchar("session_mode", { length: 20 }).notNull(), // 'Practice Mode', 'Exam Mode'
  totalQuestions: integer("total_questions").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// MCQ Questions table - stores individual questions
export const mcqQuestions = pgTable("mcq_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").references(() => mcqSessions.id, { onDelete: "cascade" }).notNull(),
  questionNumber: integer("question_number").notNull(), // Order in the session (1, 2, 3...)
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // Array of {id, text, isCorrect}
  explanation: text("explanation").notNull(),
  difficulty: varchar("difficulty", { length: 20 }).notNull(),
  topic: varchar("topic", { length: 255 }).notNull(),
  context: text("context"), // Relevant content chunk
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// MCQ Attempts table - stores user attempts at sessions
export const mcqAttempts = pgTable("mcq_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").references(() => mcqSessions.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  percentage: integer("percentage").notNull(),
  timeSpent: integer("time_spent").notNull(), // in milliseconds
  answers: jsonb("answers").notNull(), // Array of {questionId, selectedOptionId, isCorrect, timeSpent}
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export type MCQSession = typeof mcqSessions.$inferSelect;
export type NewMCQSession = typeof mcqSessions.$inferInsert;
export type MCQQuestion = typeof mcqQuestions.$inferSelect;
export type NewMCQQuestion = typeof mcqQuestions.$inferInsert;
export type MCQAttempt = typeof mcqAttempts.$inferSelect;
export type NewMCQAttempt = typeof mcqAttempts.$inferInsert;
