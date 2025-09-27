import { GoogleGenerativeAI } from "@google/generative-ai";
import { DocumentService } from "./documentService.js";

interface MCQOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface MCQQuestion {
  id: string;
  question: string;
  options: MCQOption[];
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  context: string;
}

interface MCQGenerationRequest {
  fileId: string;
  workspaceId: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  numberOfQuestions: number;
  focus: 'Tailored for me' | 'All topics' | 'Weak areas';
}

interface DocumentChunk {
  pageContent: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

interface GeminiMCQResponse {
  questions: Array<{
    question: string;
    options: Array<{
      id?: string;
      text: string;
      isCorrect: boolean;
    }>;
    explanation?: string;
    difficulty?: string;
    topic?: string;
  }>;
}

export class MCQService {
  private static genAI: GoogleGenerativeAI;
  private static model: any;

  static initialize() {
    try {
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error("GOOGLE_API_KEY environment variable is not set");
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });
      
      console.log("✅ MCQService initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize MCQService:", error);
      throw error;
    }
  }

  /**
   * Generate MCQ questions based on document content
   */
  static async generateMCQs(request: MCQGenerationRequest): Promise<MCQQuestion[]> {
    try {
      // Get relevant content chunks from vector database
      const chunks = await this.getRelevantChunks(request.fileId, request.workspaceId, request.numberOfQuestions);
      
      if (chunks.length === 0) {
        throw new Error("No content found for MCQ generation");
      }

      // Generate MCQs using Gemini
      const mcqs = await this.generateMCQsWithGemini(chunks, request);
      
      return mcqs;
    } catch (error) {
      console.error("Error generating MCQs:", error);
      throw error;
    }
  }

  /**
   * Get relevant content chunks from vector database
   */
  private static async getRelevantChunks(fileId: string, workspaceId: string, numberOfQuestions: number) {
    try {
      // Get more chunks than questions to ensure variety
      const chunksNeeded = Math.min(numberOfQuestions * 2, 50);
      
      // Use a broad search query to get diverse content
      const searchQueries = [
        "key concepts and definitions",
        "important principles and theories", 
        "main ideas and explanations",
        "examples and applications",
        "processes and procedures"
      ];

      let allChunks: DocumentChunk[] = [];

      // Search with multiple queries to get diverse content
      for (const query of searchQueries) {
        const results = await DocumentService.searchSimilarDocuments(
          query,
          workspaceId,
          Math.ceil(chunksNeeded / searchQueries.length)
        );
        allChunks = allChunks.concat(results);
      }

      // Remove duplicates and select best chunks
      const uniqueChunks = this.removeDuplicateChunks(allChunks);
      
      // Sort by relevance score and take the best ones
      const selectedChunks = uniqueChunks
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, chunksNeeded);

      return selectedChunks;
    } catch (error) {
      console.error("Error getting relevant chunks:", error);
      throw error;
    }
  }

  /**
   * Remove duplicate chunks based on content similarity
   */
  private static removeDuplicateChunks(chunks: DocumentChunk[]) {
    const uniqueChunks: DocumentChunk[] = [];
    const seenContent = new Set();

    for (const chunk of chunks) {
      // Create a normalized version of the content for comparison
      const normalizedContent = chunk.pageContent
        ?.toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 100);

      if (normalizedContent && !seenContent.has(normalizedContent)) {
        seenContent.add(normalizedContent);
        uniqueChunks.push(chunk);
      }
    }

    return uniqueChunks;
  }

  /**
   * Generate MCQs using Gemini AI
   */
  private static async generateMCQsWithGemini(chunks: DocumentChunk[], request: MCQGenerationRequest): Promise<MCQQuestion[]> {
    try {
      const contextText = chunks
        .map(chunk => chunk.pageContent)
        .join('\n\n---\n\n');

      const prompt = this.buildMCQPrompt(contextText, request);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from markdown code blocks if present
      const cleanedText = this.extractJSONFromResponse(text);
      
      // Parse the JSON response
      let mcqData: GeminiMCQResponse;
      try {
        mcqData = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error("JSON parsing failed. Raw response:", text);
        console.error("Cleaned text:", cleanedText);
        console.error("Parse error:", parseError);
        throw new Error("Invalid JSON response from AI model");
      }
      
      // Validate and format the MCQs
      const formattedMCQs = this.formatMCQs(mcqData.questions || [], chunks);
      
      return formattedMCQs.slice(0, request.numberOfQuestions);
    } catch (error) {
      console.error("Error generating MCQs with Gemini:", error);
      throw new Error("Failed to generate MCQs. Please try again.");
    }
  }

  /**
   * Extract JSON from Gemini response, handling markdown code blocks
   */
  private static extractJSONFromResponse(text: string): string {
    // Remove markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }
    
    // If no code blocks, try to find JSON object
    const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      return jsonObjectMatch[0].trim();
    }
    
    // Return original text if no JSON structure found
    return text.trim();
  }

  /**
   * Build the prompt for Gemini MCQ generation
   */
  private static buildMCQPrompt(contextText: string, request: MCQGenerationRequest): string {
    const difficultyInstructions = {
      'Easy': 'Focus on basic recall, definitions, and simple concepts. Questions should test fundamental understanding.',
      'Medium': 'Include application questions, analysis of concepts, and connections between ideas. Require deeper thinking.',
      'Hard': 'Create complex scenarios, synthesis questions, and critical thinking challenges. Test advanced understanding.'
    };

    return `You are an expert educator creating high-quality multiple choice questions for students. 

CONTENT TO BASE QUESTIONS ON:
${contextText}

REQUIREMENTS:
- Generate ${request.numberOfQuestions} multiple choice questions
- Difficulty level: ${request.difficulty} - ${difficultyInstructions[request.difficulty]}
- Each question must have exactly 4 options (A, B, C, D)
- Only ONE option should be correct
- Questions should be practical and test real understanding, not just memorization
- Avoid trick questions or overly complex wording
- Include clear explanations for why the correct answer is right
- Base questions directly on the provided content
- Make distractors (wrong answers) plausible but clearly incorrect

QUESTION TYPES TO INCLUDE:
- Conceptual understanding (What is...?)
- Application (How would you...?)
- Analysis (Why does...?)
- Comparison (What is the difference between...?)
- Cause and effect (What happens when...?)

FORMAT YOUR RESPONSE AS VALID JSON:
{
  "questions": [
    {
      "question": "Clear, specific question text",
      "options": [
        {"id": "A", "text": "Option A text", "isCorrect": false},
        {"id": "B", "text": "Option B text", "isCorrect": true},
        {"id": "C", "text": "Option C text", "isCorrect": false},
        {"id": "D", "text": "Option D text", "isCorrect": false}
      ],
      "explanation": "Detailed explanation of why the correct answer is right and why others are wrong",
      "difficulty": "${request.difficulty}",
      "topic": "Main topic/concept being tested"
    }
  ]
}

CRITICAL FORMATTING REQUIREMENTS:
- Return ONLY valid JSON - no markdown code blocks, no explanatory text
- Do not wrap the JSON in backticks or any other formatting
- Start your response directly with { and end with }
- Ensure each question tests important concepts from the content
- Make sure explanations are educational and helpful
- Verify that exactly one option is marked as correct for each question

EXAMPLE RESPONSE FORMAT (return exactly this structure):
{
  "questions": [
    {
      "question": "What is the main principle discussed?",
      "options": [
        {"id": "A", "text": "Option A", "isCorrect": false},
        {"id": "B", "text": "Correct answer", "isCorrect": true},
        {"id": "C", "text": "Option C", "isCorrect": false},
        {"id": "D", "text": "Option D", "isCorrect": false}
      ],
      "explanation": "Detailed explanation here",
      "difficulty": "${request.difficulty}",
      "topic": "Topic name"
    }
  ]
}`;
  }

  /**
   * Format and validate MCQs from Gemini response
   */
  private static formatMCQs(questions: GeminiMCQResponse['questions'], chunks: DocumentChunk[]): MCQQuestion[] {
    const formattedMCQs: MCQQuestion[] = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      // Validate question structure
      if (!q.question || !q.options || !Array.isArray(q.options) || q.options.length !== 4) {
        continue;
      }

      // Ensure exactly one correct answer
      const correctOptions = q.options.filter(opt => opt.isCorrect);
      if (correctOptions.length !== 1) {
        continue;
      }

      // Find relevant context chunk for this question
      const relevantChunk = chunks[Math.floor(i * chunks.length / questions.length)] || chunks[0];
      
      const formattedMCQ: MCQQuestion = {
        id: `mcq_${Date.now()}_${i}`,
        question: q.question.trim(),
        options: q.options.map((opt, index: number) => ({
          id: opt.id || String.fromCharCode(65 + index), // A, B, C, D
          text: opt.text.trim(),
          isCorrect: Boolean(opt.isCorrect)
        })),
        explanation: q.explanation?.trim() || "No explanation provided.",
        difficulty: q.difficulty || 'Medium',
        topic: q.topic?.trim() || "General Knowledge",
        context: relevantChunk?.pageContent?.substring(0, 200) + "..." || ""
      };

      formattedMCQs.push(formattedMCQ);
    }

    return formattedMCQs;
  }

  /**
   * Get optimal number of chunks based on question count
   */
  private static getOptimalChunkCount(numberOfQuestions: number): number {
    // Use more chunks for more questions, but with diminishing returns
    if (numberOfQuestions <= 10) return Math.min(numberOfQuestions * 2, 20);
    if (numberOfQuestions <= 20) return Math.min(numberOfQuestions * 1.5, 30);
    return Math.min(numberOfQuestions * 1.2, 40);
  }
}
