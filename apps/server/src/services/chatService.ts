import { GoogleGenerativeAI } from "@google/generative-ai";
import { DocumentService } from "./documentService.js";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{
    content: string;
    score: number;
    metadata?: Record<string, unknown>;
  }>;
}

interface ChatRequest {
  message: string;
  fileId?: string;
  workspaceId: string;
  conversationHistory?: ChatMessage[];
}

interface ChatResponse {
  message: string;
  sources: Array<{
    content: string;
    score: number;
    metadata?: Record<string, unknown>;
  }>;
  conversationId?: string;
}

export class ChatService {
  private static genAI: GoogleGenerativeAI;
  private static model: unknown;

  static initialize() {
    try {
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error("GOOGLE_API_KEY environment variable is not set");
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });
      
      console.log("✅ ChatService initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize ChatService:", error);
      throw error;
    }
  }

  /**
   * Process a chat message and generate a response using document context
   */
  static async processMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      // Get relevant context from vector database
      const contextChunks = await this.getRelevantContext(
        request.message, 
        request.workspaceId, 
        request.fileId
      );

      // Generate response using Gemini with context
      const response = await this.generateContextualResponse(
        request.message,
        contextChunks,
        request.conversationHistory || []
      );

      return {
        message: response,
        sources: contextChunks.map(chunk => ({
          content: chunk.pageContent,
          score: chunk.score || 0,
          metadata: chunk.metadata
        }))
      };
    } catch (error) {
      console.error("Error processing chat message:", error);
      throw new Error("Failed to process chat message");
    }
  }

  /**
   * Get relevant context from vector database based on user query
   */
  private static async getRelevantContext(
    query: string, 
    workspaceId: string, 
    _fileId?: string
  ) {
    try {
      // Use multiple search strategies for comprehensive context
      const searchQueries = [
        query, // Direct query
        this.extractKeyTerms(query), // Key terms
        this.generateRelatedQueries(query) // Related concepts
      ].flat();

      let allChunks: Array<{
        pageContent: string;
        score?: number;
        metadata?: Record<string, unknown>;
      }> = [];

      // Search with multiple queries to get comprehensive context
      for (const searchQuery of searchQueries.slice(0, 3)) { // Limit to 3 queries
        try {
          const results = await DocumentService.searchSimilarDocuments(
            searchQuery,
            workspaceId,
            15 // Get more chunks for better context
          );
          allChunks = allChunks.concat(results);
        } catch (error) {
          console.error(`Error searching for query "${searchQuery}":`, error);
        }
      }

      // Remove duplicates and select best chunks
      const uniqueChunks = this.removeDuplicateChunks(allChunks);
      
      // Sort by relevance and take top chunks
      const topChunks = uniqueChunks
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 20); // Use up to 20 chunks for comprehensive context

      return topChunks;
    } catch (error) {
      console.error("Error getting relevant context:", error);
      return [];
    }
  }

  /**
   * Extract key terms from user query for better search
   */
  private static extractKeyTerms(query: string): string[] {
    // Remove common words and extract meaningful terms
    const commonWords = new Set([
      'what', 'how', 'why', 'when', 'where', 'who', 'which', 'can', 'could', 
      'would', 'should', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'shall', 'may', 
      'might', 'must', 'ought', 'the', 'a', 'an', 'and', 'or', 'but', 'in',
      'on', 'at', 'to', 'for', 'of', 'with', 'by', 'about', 'tell', 'me',
      'explain', 'describe', 'define'
    ]);

    const terms = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 2 && !commonWords.has(term))
      .slice(0, 5); // Take top 5 key terms

    return terms;
  }

  /**
   * Generate related queries for comprehensive search
   */
  private static generateRelatedQueries(query: string): string[] {
    const relatedQueries: string[] = [];
    
    // Add variations based on common question patterns
    const keyTerms = this.extractKeyTerms(query);
    if (keyTerms.length > 0) {
      relatedQueries.push(keyTerms.join(' '));
      
      // Add concept-based queries
      if (query.toLowerCase().includes('how')) {
        relatedQueries.push(`process ${keyTerms.join(' ')}`);
        relatedQueries.push(`steps ${keyTerms.join(' ')}`);
      }
      
      if (query.toLowerCase().includes('what')) {
        relatedQueries.push(`definition ${keyTerms.join(' ')}`);
        relatedQueries.push(`concept ${keyTerms.join(' ')}`);
      }
      
      if (query.toLowerCase().includes('why')) {
        relatedQueries.push(`reason ${keyTerms.join(' ')}`);
        relatedQueries.push(`cause ${keyTerms.join(' ')}`);
      }
    }

    return relatedQueries.slice(0, 2); // Limit to 2 related queries
  }

  /**
   * Remove duplicate chunks based on content similarity
   */
  private static removeDuplicateChunks(chunks: Array<{
    pageContent: string;
    score?: number;
    metadata?: Record<string, unknown>;
  }>) {
    const uniqueChunks: Array<{
      pageContent: string;
      score?: number;
      metadata?: Record<string, unknown>;
    }> = [];
    const seenContent = new Set();

    for (const chunk of chunks) {
      const normalizedContent = chunk.pageContent
        ?.toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 200); // Use first 200 chars for comparison

      if (normalizedContent && !seenContent.has(normalizedContent)) {
        seenContent.add(normalizedContent);
        uniqueChunks.push(chunk);
      }
    }

    return uniqueChunks;
  }

  /**
   * Generate contextual response using Gemini with document context
   */
  private static async generateContextualResponse(
    userQuery: string,
    contextChunks: Array<{
      pageContent: string;
      score?: number;
      metadata?: Record<string, unknown>;
    }>,
    conversationHistory: ChatMessage[]
  ): Promise<string> {
    try {
      // Prepare context from chunks
      const contextText = contextChunks
        .map((chunk, index) => `[Context ${index + 1}]\n${chunk.pageContent}`)
        .join('\n\n---\n\n');

      // Prepare conversation history
      const historyText = conversationHistory
        .slice(-6) // Last 6 messages for context
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

      const prompt = this.buildChatPrompt(userQuery, contextText, historyText);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return text.trim();
    } catch (error) {
      console.error("Error generating contextual response:", error);
      throw new Error("Failed to generate response");
    }
  }

  /**
   * Build the prompt for contextual chat response
   */
  private static buildChatPrompt(
    userQuery: string, 
    contextText: string, 
    conversationHistory: string
  ): string {
    return `You are Sozi, an intelligent AI study assistant. Your role is to help students understand their study materials by answering questions based on the provided document context.

DOCUMENT CONTEXT:
${contextText}

${conversationHistory ? `CONVERSATION HISTORY:\n${conversationHistory}\n` : ''}

USER QUESTION: ${userQuery}

INSTRUCTIONS:
1. Answer the question using ONLY the information provided in the document context above
2. Be comprehensive and detailed in your explanations
3. If the context contains relevant information, provide a thorough answer with examples and details
4. If the question cannot be fully answered from the context, clearly state what information is available and what is missing
5. Use a conversational, helpful tone appropriate for a study assistant
6. Structure your response clearly with bullet points or numbered lists when appropriate
7. Reference specific concepts, examples, or details from the context when relevant
8. If there are multiple relevant sections in the context, synthesize them into a coherent answer

RESPONSE GUIDELINES:
- Start directly with the answer (no "Based on the context" prefixes)
- Be specific and cite relevant details from the document
- Explain concepts clearly as if teaching a student
- Use examples from the context when available
- If the context is insufficient, suggest what additional information would be helpful

ANSWER:`;
  }

  /**
   * Get chat history for a conversation (placeholder for future implementation)
   */
  static async getChatHistory(_conversationId: string): Promise<ChatMessage[]> {
    // TODO: Implement chat history storage and retrieval
    return [];
  }

  /**
   * Save chat message (placeholder for future implementation)
   */
  static async saveChatMessage(
    _conversationId: string, 
    _message: ChatMessage
  ): Promise<void> {
    // TODO: Implement chat message storage
  }
}
