import { db } from "../db/index.js";
import { mcqSessions, mcqQuestions, mcqAttempts } from "../db/schema/mcqs.js";
import type { NewMCQSession, NewMCQQuestion, NewMCQAttempt } from "../db/schema/mcqs.js";
import { eq, and, desc } from "drizzle-orm";

export class MCQDbService {
  /**
   * Create a new MCQ session with questions
   */
  static async createMCQSession(
    sessionData: Omit<NewMCQSession, 'id' | 'createdAt' | 'updatedAt'>,
    questions: Array<{
      question: string;
      options: Array<{ id: string; text: string; isCorrect: boolean }>;
      explanation: string;
      difficulty: string;
      topic: string;
      context?: string;
    }>
  ) {
    try {
      // Create the session
      const [session] = await db
        .insert(mcqSessions)
        .values({
          ...sessionData,
          totalQuestions: questions.length,
        })
        .returning();

      // Create the questions
      const questionInserts: NewMCQQuestion[] = questions.map((q, index) => ({
        sessionId: session.id,
        questionNumber: index + 1,
        question: q.question,
        options: q.options,
        explanation: q.explanation,
        difficulty: q.difficulty,
        topic: q.topic,
        context: q.context || '',
      }));

      const insertedQuestions = await db
        .insert(mcqQuestions)
        .values(questionInserts)
        .returning();

      return {
        session,
        questions: insertedQuestions,
      };
    } catch (error) {
      console.error("Error creating MCQ session:", error);
      throw error;
    }
  }

  /**
   * Get MCQ session by ID with questions
   */
  static async getMCQSessionById(sessionId: string, userId: string) {
    try {
      const [session] = await db
        .select()
        .from(mcqSessions)
        .where(and(eq(mcqSessions.id, sessionId), eq(mcqSessions.userId, userId)));

      if (!session) {
        return null;
      }

      const questions = await db
        .select()
        .from(mcqQuestions)
        .where(eq(mcqQuestions.sessionId, sessionId))
        .orderBy(mcqQuestions.questionNumber);

      return {
        session,
        questions,
      };
    } catch (error) {
      console.error("Error getting MCQ session:", error);
      throw error;
    }
  }

  /**
   * Get all MCQ sessions for a file
   */
  static async getMCQSessionsByFileId(fileId: string, userId: string) {
    try {
      const sessions = await db
        .select()
        .from(mcqSessions)
        .where(and(eq(mcqSessions.fileId, fileId), eq(mcqSessions.userId, userId)))
        .orderBy(desc(mcqSessions.createdAt));

      return sessions;
    } catch (error) {
      console.error("Error getting MCQ sessions by file ID:", error);
      throw error;
    }
  }

  /**
   * Get all MCQ sessions for a workspace
   */
  static async getMCQSessionsByWorkspaceId(workspaceId: string, userId: string) {
    try {
      const sessions = await db
        .select()
        .from(mcqSessions)
        .where(and(eq(mcqSessions.workspaceId, workspaceId), eq(mcqSessions.userId, userId)))
        .orderBy(desc(mcqSessions.createdAt));

      return sessions;
    } catch (error) {
      console.error("Error getting MCQ sessions by workspace ID:", error);
      throw error;
    }
  }

  /**
   * Save an MCQ attempt
   */
  static async saveMCQAttempt(attemptData: Omit<NewMCQAttempt, 'id' | 'completedAt'>) {
    try {
      const [attempt] = await db
        .insert(mcqAttempts)
        .values(attemptData)
        .returning();

      return attempt;
    } catch (error) {
      console.error("Error saving MCQ attempt:", error);
      throw error;
    }
  }

  /**
   * Get attempts for a session
   */
  static async getAttemptsBySessionId(sessionId: string, userId: string) {
    try {
      const attempts = await db
        .select()
        .from(mcqAttempts)
        .where(and(eq(mcqAttempts.sessionId, sessionId), eq(mcqAttempts.userId, userId)))
        .orderBy(desc(mcqAttempts.completedAt));

      return attempts;
    } catch (error) {
      console.error("Error getting attempts by session ID:", error);
      throw error;
    }
  }

  /**
   * Get user's best attempt for a session
   */
  static async getBestAttemptBySessionId(sessionId: string, userId: string) {
    try {
      const attempts = await this.getAttemptsBySessionId(sessionId, userId);
      
      if (attempts.length === 0) {
        return null;
      }

      // Find the attempt with the highest score
      const bestAttempt = attempts.reduce((best, current) => {
        return current.score > best.score ? current : best;
      });

      return bestAttempt;
    } catch (error) {
      console.error("Error getting best attempt:", error);
      throw error;
    }
  }

  /**
   * Delete an MCQ session and all related data
   */
  static async deleteMCQSession(sessionId: string, userId: string) {
    try {
      // Verify ownership
      const [session] = await db
        .select()
        .from(mcqSessions)
        .where(and(eq(mcqSessions.id, sessionId), eq(mcqSessions.userId, userId)));

      if (!session) {
        throw new Error("MCQ session not found or access denied");
      }

      // Delete the session (cascade will handle questions and attempts)
      await db
        .delete(mcqSessions)
        .where(eq(mcqSessions.id, sessionId));

      return true;
    } catch (error) {
      console.error("Error deleting MCQ session:", error);
      throw error;
    }
  }

  /**
   * Update MCQ session title
   */
  static async updateMCQSessionTitle(sessionId: string, userId: string, title: string) {
    try {
      const [updatedSession] = await db
        .update(mcqSessions)
        .set({ 
          title,
          updatedAt: new Date()
        })
        .where(and(eq(mcqSessions.id, sessionId), eq(mcqSessions.userId, userId)))
        .returning();

      return updatedSession;
    } catch (error) {
      console.error("Error updating MCQ session title:", error);
      throw error;
    }
  }

  /**
   * Get session statistics
   */
  static async getSessionStatistics(sessionId: string, userId: string) {
    try {
      const attempts = await this.getAttemptsBySessionId(sessionId, userId);
      
      if (attempts.length === 0) {
        return {
          totalAttempts: 0,
          bestScore: 0,
          averageScore: 0,
          bestPercentage: 0,
          averagePercentage: 0,
          totalTimeSpent: 0,
          averageTimeSpent: 0,
        };
      }

      const totalAttempts = attempts.length;
      const bestScore = Math.max(...attempts.map(a => a.score));
      const averageScore = attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts;
      const bestPercentage = Math.max(...attempts.map(a => a.percentage));
      const averagePercentage = attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts;
      const totalTimeSpent = attempts.reduce((sum, a) => sum + a.timeSpent, 0);
      const averageTimeSpent = totalTimeSpent / totalAttempts;

      return {
        totalAttempts,
        bestScore,
        averageScore: Math.round(averageScore * 100) / 100,
        bestPercentage,
        averagePercentage: Math.round(averagePercentage * 100) / 100,
        totalTimeSpent,
        averageTimeSpent: Math.round(averageTimeSpent),
      };
    } catch (error) {
      console.error("Error getting session statistics:", error);
      throw error;
    }
  }
}
