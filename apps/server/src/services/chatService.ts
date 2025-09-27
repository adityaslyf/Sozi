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
  private static responseCache = new Map<string, { response: string; timestamp: number }>();

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
      // Disable caching for now to ensure comprehensive fresh results
      // const cacheKey = `${request.workspaceId}:${request.fileId}:${request.message.toLowerCase()}`;
      // const cached = this.responseCache.get(cacheKey);
      // if (cached && Date.now() - cached.timestamp < 120000) { // 2 minutes
      //   return {
      //     message: cached.response,
      //     sources: []
      //   };
      // }

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

      // Disable caching for comprehensive results
      // if (this.isSimpleFactualQuestion(request.message)) {
      //   this.responseCache.set(cacheKey, {
      //     response,
      //     timestamp: Date.now()
      //   });
      // }

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
      // Get comprehensive context - much more chunks for full coverage
      const results = await DocumentService.searchSimilarDocuments(
        query,
        workspaceId,
        50 // Get many more chunks for comprehensive context
      );

      // Always do additional broad searches for maximum context coverage
      const additionalQueries = this.generateComprehensiveSearchQueries(query);
      
      for (const additionalQuery of additionalQueries) {
        try {
          const additionalResults = await DocumentService.searchSimilarDocuments(
            additionalQuery,
            workspaceId,
            30 // Get more chunks from each additional search
          );
          results.push(...additionalResults);
        } catch (error) {
          console.error(`Error with additional search "${additionalQuery}":`, error);
        }
      }

      // Remove duplicates and return comprehensive results
      const uniqueResults = this.removeDuplicateChunks(results);
      return uniqueResults.slice(0, 30); // Return top 30 unique chunks for full context
    } catch (error) {
      console.error("Error getting relevant context:", error);
      return [];
    }
  }

  /**
   * Generate comprehensive search queries for maximum context coverage
   */
  private static generateComprehensiveSearchQueries(query: string): string[] {
    const lowerQuery = query.toLowerCase();
    const additionalQueries: string[] = [];

    // Always include these broad searches for comprehensive coverage
    additionalQueries.push(
      'title', 'book', 'chapter', 'author', 'introduction', 'conclusion',
      'concept', 'principle', 'idea', 'theory', 'definition', 'example',
      'summary', 'overview', 'key', 'main', 'important', 'fundamental'
    );

    // Add specific searches based on query content
    if (lowerQuery.includes('name') || lowerQuery.includes('title')) {
      additionalQueries.push('book title', 'name', 'called', 'titled', 'work', 'publication');
    }
    
    if (lowerQuery.includes('author')) {
      additionalQueries.push('written by', 'by', 'creator', 'writer', 'published');
    }

    if (lowerQuery.includes('concept') || lowerQuery.includes('main')) {
      additionalQueries.push('framework', 'model', 'approach', 'method', 'strategy', 'technique');
    }

    if (lowerQuery.includes('how') || lowerQuery.includes('process')) {
      additionalQueries.push('process', 'steps', 'method', 'approach', 'way', 'technique');
    }

    if (lowerQuery.includes('why') || lowerQuery.includes('reason')) {
      additionalQueries.push('reason', 'because', 'cause', 'purpose', 'benefit', 'advantage');
    }

    // Return more queries for comprehensive coverage
    return additionalQueries.slice(0, 8); // Use up to 8 additional search terms
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
        .substring(0, 100); // Use first 100 chars for comparison

      if (normalizedContent && !seenContent.has(normalizedContent)) {
        seenContent.add(normalizedContent);
        uniqueChunks.push(chunk);
      }
    }

    return uniqueChunks.sort((a, b) => (b.score || 0) - (a.score || 0));
  }


  /**
   * Analyze document context to identify key topics for knowledge enhancement
   */
  private static analyzeDocumentTopics(contextChunks: Array<{
    pageContent: string;
    score?: number;
    metadata?: Record<string, unknown>;
  }>): string[] {
    const allText = contextChunks
      .slice(0, 15) // Analyze top 15 chunks for better coverage
      .map(chunk => chunk.pageContent)
      .join(' ')
      .toLowerCase();

    // Extract key topics and concepts
    const topics: string[] = [];
    
    // Comprehensive topic patterns for various subjects
    const topicPatterns = [
      // Self-help/Psychology
      { pattern: /habit|habits/g, topic: 'habit formation' },
      { pattern: /atomic|small changes/g, topic: 'incremental improvement' },
      { pattern: /behavior|behaviour/g, topic: 'behavioral psychology' },
      { pattern: /identity/g, topic: 'identity-based habits' },
      { pattern: /system|systems/g, topic: 'systems thinking' },
      { pattern: /goal|goals/g, topic: 'goal setting' },
      { pattern: /motivation/g, topic: 'motivation psychology' },
      { pattern: /environment/g, topic: 'environmental design' },
      { pattern: /cue|trigger/g, topic: 'behavioral triggers' },
      { pattern: /reward|rewards/g, topic: 'reward systems' },
      { pattern: /compound|compounding/g, topic: 'compound effects' },
      { pattern: /change|transformation/g, topic: 'personal change' },
      { pattern: /mindset/g, topic: 'mindset psychology' },
      { pattern: /productivity/g, topic: 'productivity methods' },
      
      // Business/Management
      { pattern: /business|company/g, topic: 'business strategy' },
      { pattern: /leadership/g, topic: 'leadership principles' },
      { pattern: /management/g, topic: 'management theory' },
      { pattern: /strategy|strategic/g, topic: 'strategic thinking' },
      { pattern: /innovation/g, topic: 'innovation management' },
      { pattern: /marketing/g, topic: 'marketing strategy' },
      
      // Science/Technology
      { pattern: /algorithm|algorithms/g, topic: 'computer algorithms' },
      { pattern: /data|analytics/g, topic: 'data science' },
      { pattern: /machine learning|ai/g, topic: 'artificial intelligence' },
      { pattern: /programming|code/g, topic: 'software development' },
      { pattern: /research|study/g, topic: 'research methodology' },
      
      // General Academic
      { pattern: /theory|theories/g, topic: 'theoretical frameworks' },
      { pattern: /principle|principles/g, topic: 'fundamental principles' },
      { pattern: /concept|concepts/g, topic: 'key concepts' },
      { pattern: /method|methodology/g, topic: 'methodological approaches' },
      { pattern: /analysis|analytical/g, topic: 'analytical thinking' },
      { pattern: /framework/g, topic: 'conceptual frameworks' },
      { pattern: /model|models/g, topic: 'theoretical models' }
    ];

    topicPatterns.forEach(({ pattern, topic }) => {
      if (pattern.test(allText)) {
        topics.push(topic);
      }
    });

    // If no specific topics found, add general academic topics
    if (topics.length === 0) {
      topics.push('general knowledge', 'academic concepts', 'learning principles');
    }

    return [...new Set(topics)].slice(0, 6); // Return top 6 unique topics
  }

  /**
   * Generate contextual response using Gemini with document context and built-in knowledge
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
      // Analyze document topics for enhanced knowledge integration
      const documentTopics = this.analyzeDocumentTopics(contextChunks);
      
      // Use comprehensive context for full document coverage
      const contextText = contextChunks
        .slice(0, 25) // Use up to 25 chunks for comprehensive context
        .map((chunk, index) => `[Context ${index + 1}]\n${chunk.pageContent}`)
        .join('\n\n---\n\n');

      // Prepare conversation history - keep more for better continuity
      const historyText = conversationHistory
        .slice(-6) // Last 6 messages (3 exchanges)
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

      const prompt = this.buildEnhancedChatPrompt(userQuery, contextText, historyText, documentTopics);
      
      const result = await (this.model as any).generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return text.trim();
    } catch (error) {
      console.error("Error generating contextual response:", error);
      throw new Error("Failed to generate response");
    }
  }

  /**
   * Build enhanced prompt that leverages both document context and Gemini's knowledge
   */
  private static buildEnhancedChatPrompt(
    userQuery: string, 
    contextText: string, 
    conversationHistory: string,
    documentTopics: string[]
  ): string {
    // Detect if this is a simple factual question that needs a direct answer
    const isSimpleFactual = this.isSimpleFactualQuestion(userQuery);
    
    if (isSimpleFactual) {
      return `You are an expert AI assistant with access to both comprehensive document context AND your extensive built-in knowledge. Use both sources intelligently to provide the most accurate and helpful answer.

DOCUMENT CONTEXT FROM USER'S FILE:
${contextText}

IDENTIFIED DOCUMENT TOPICS: ${documentTopics.join(', ')}

QUESTION: ${userQuery}

INSTRUCTIONS:
- FIRST: Search through ALL the document context thoroughly for the specific answer
- SECOND: Use your built-in knowledge about the identified topics (${documentTopics.join(', ')}) to supplement or verify
- If asking for a book title/name: Look in document context first, then use your knowledge of books to help identify or confirm
- If asking for an author: Check document context first, then use your knowledge to provide complete author information
- If asking for concepts: Use document context as primary source, enhance with your knowledge for clarity
- PRIORITIZE document context over general knowledge when they conflict
- Give the direct answer, but you can add brief helpful context from your knowledge if relevant
- If found in document: State it clearly and confidently
- If not in document but you know from your training: Say "Not explicitly stated in the document, but based on my knowledge of [topic]..."

ANSWER:`;
    }

    return `You are Sozi, an advanced AI study assistant with access to both comprehensive document context AND your extensive built-in knowledge. Combine both sources intelligently to provide the most helpful and complete answers.

DOCUMENT CONTEXT FROM USER'S FILE:
${contextText}

IDENTIFIED DOCUMENT TOPICS: ${documentTopics.join(', ')}

${conversationHistory ? `PREVIOUS CONVERSATION:\n${conversationHistory}\n` : ''}

QUESTION: ${userQuery}

INSTRUCTIONS:
- PRIMARY SOURCE: Use the document context as your main source of information
- SECONDARY SOURCE: Enhance with your built-in knowledge, especially about: ${documentTopics.join(', ')}
- Search through every context section thoroughly for relevant information
- Use your knowledge to:
  * Explain concepts more clearly when document context is technical
  * Provide additional examples or analogies to help understanding
  * Connect document concepts to broader knowledge and real-world applications
  * Fill in gaps where document context might be incomplete
  * Draw from your knowledge of ${documentTopics.join(', ')} to provide richer context
- ALWAYS prioritize document context over your general knowledge when they conflict
- Be explicit about sources: "According to the document..." vs "From my knowledge of [topic]..."
- Give comprehensive answers that combine both sources effectively
- Use bullet points or numbered lists for complex topics
- If document context is insufficient, use your knowledge but clearly indicate: "The document doesn't cover this, but I can explain that..."

ANSWER:`;
  }

  /**
   * Build the prompt for contextual chat response (legacy method for compatibility)
   */
  private static buildChatPrompt(
    userQuery: string, 
    contextText: string, 
    conversationHistory: string
  ): string {
    // Detect if this is a simple factual question that needs a direct answer
    const isSimpleFactual = this.isSimpleFactualQuestion(userQuery);
    
    if (isSimpleFactual) {
      return `You are an expert AI assistant with access to both comprehensive document context AND your built-in knowledge. Use both sources to provide the most accurate answer.

DOCUMENT CONTEXT FROM USER'S FILE:
${contextText}

QUESTION: ${userQuery}

INSTRUCTIONS:
- FIRST: Search through ALL the document context thoroughly for the specific answer
- SECOND: Use your built-in knowledge to supplement or verify the information
- If asking for a book title/name: Look in document context first, then use your knowledge of books to help identify or confirm
- If asking for an author: Check document context first, then use your knowledge to provide complete author information
- If asking for concepts: Use document context as primary source, enhance with your general knowledge for clarity
- PRIORITIZE document context over general knowledge when they conflict
- Give the direct answer, but you can add brief helpful context from your knowledge if relevant
- If found in document: State it clearly and confidently
- If not in document but you know from your training: Say "Not explicitly stated in the document, but based on my knowledge..."

ANSWER:`;
    }

    return `You are Sozi, an advanced AI study assistant with access to both comprehensive document context AND your extensive built-in knowledge. Combine both sources to provide the most helpful and complete answers.

DOCUMENT CONTEXT FROM USER'S FILE:
${contextText}

${conversationHistory ? `PREVIOUS CONVERSATION:\n${conversationHistory}\n` : ''}

QUESTION: ${userQuery}

INSTRUCTIONS:
- PRIMARY SOURCE: Use the document context as your main source of information
- SECONDARY SOURCE: Enhance with your built-in knowledge to provide comprehensive understanding
- Search through every context section thoroughly for relevant information
- Use your knowledge to:
  * Explain concepts more clearly when document context is technical
  * Provide additional examples or analogies to help understanding
  * Connect document concepts to broader knowledge and real-world applications
  * Fill in gaps where document context might be incomplete
- ALWAYS prioritize document context over your general knowledge when they conflict
- Be explicit about sources: "According to the document..." vs "From my knowledge..."
- Give comprehensive answers that combine both sources effectively
- Use bullet points or numbered lists for complex topics
- If document context is insufficient, use your knowledge but clearly indicate: "The document doesn't cover this, but I can explain that..."

ANSWER:`;
  }

  /**
   * Detect if question needs a simple, direct answer
   */
  private static isSimpleFactualQuestion(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    const simplePatterns = [
      /^what is the name/,
      /^what is the title/,
      /^who is the author/,
      /^when was/,
      /^where is/,
      /^how many/,
      /^what year/,
      /name of the book/,
      /title of the book/,
      /author of/,
      /book title/,
      /book name/,
      /written by/,
      /who wrote/,
      /what book/,
      /which book/,
      /book called/,
      /title is/
    ];
    
    return simplePatterns.some(pattern => pattern.test(lowerQuery));
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
