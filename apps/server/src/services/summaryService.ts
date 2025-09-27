import { DocumentService } from "./documentService.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export class SummaryService {
	private static genAI: GoogleGenerativeAI;
	private static model: any;
	private static initialized: boolean = false;

	/**
	 * Initialize the summary service with Gemini
	 */
	static async initialize() {
		try {
			if (!process.env.GOOGLE_API_KEY) {
				throw new Error("GOOGLE_API_KEY is required for summary generation");
			}

			this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
			this.model = this.genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });
			this.initialized = true;
		} catch (error) {
			console.error("Failed to initialize SummaryService:", error);
			throw error;
		}
	}

	/**
	 * Get optimal chunk count based on document size
	 */
	static getOptimalChunkCount(totalChunks: number): number {
		if (totalChunks < 20) return Math.min(totalChunks, 15);
		if (totalChunks < 50) return 25;
		if (totalChunks < 100) return 40;
		return 50; // Max for very large docs
	}

	/**
	 * Generate golden summary for a file using its chunks from vector database
	 */
	static async generateGoldenSummary(
		fileId: string,
		fileName: string,
		workspaceId: string,
		maxChunks?: number
	): Promise<{
		summary: string;
		keyTopics: string[];
		structure: Array<{ heading: string; content: string }>;
	}> {
		if (!this.initialized) {
			throw new Error("SummaryService not initialized");
		}

		try {
			// 1. RETRIEVE RELEVANT CHUNKS FROM VECTOR DATABASE
			// Use diverse search queries to get comprehensive coverage of the document
			const searchQueries = [
				"introduction overview main points",
				"key concepts important ideas",
				"methods approach techniques",
				"results findings conclusions",
				"summary key takeaways",
				"definitions terminology concepts",
				"examples case studies",
				"recommendations implications"
			];

			let allChunks: Array<{ pageContent: string; metadata: Record<string, unknown>; score: number }> = [];
			
			// Search with different queries to get diverse content
			for (const query of searchQueries) {
				const chunks = await DocumentService.searchSimilarDocuments(query, workspaceId, 4);
				// Filter chunks that belong to this specific file
				const fileChunks = chunks.filter(chunk => 
					chunk.metadata && chunk.metadata.fileId === fileId
				);
				allChunks.push(...fileChunks);
			}

			// Remove duplicates based on content similarity and sort by relevance
			const allUniqueChunks = Array.from(
				new Map(allChunks.map(chunk => [chunk.pageContent.substring(0, 100), chunk])).values()
			)
			.sort((a, b) => b.score - a.score); // Sort by relevance score

			if (allUniqueChunks.length === 0) {
				throw new Error("No content found for this file in vector database");
			}

			// Determine optimal chunk count if not specified
			const optimalChunkCount = maxChunks || this.getOptimalChunkCount(allUniqueChunks.length);
			const uniqueChunks = allUniqueChunks.slice(0, optimalChunkCount);

			// Retrieved optimal chunks for processing

			// 2. PREPARE CHUNKS FOR GEMINI
			// Organize chunks with metadata for better context
			const contextChunks = uniqueChunks.map((chunk, index) => {
				const chunkIndex = chunk.metadata?.chunkIndex || index;
				const totalChunks = chunk.metadata?.totalChunks || uniqueChunks.length;
				
				return `--- Chunk ${index + 1} (${chunkIndex}/${totalChunks}) ---
${chunk.pageContent.trim()}`;
			}).join("\n\n");

			// 3. PASS CHUNKS TO GEMINI WITH STRUCTURED PROMPT
			const summaryPrompt = `You are an expert academic note-maker creating "Golden Notes" from study material.

TASK: Analyze the following text chunks from "${fileName}" and create structured golden notes.

INSTRUCTIONS:
✅ Remove redundancy between chunks
✅ Keep only core facts, insights, and key concepts
✅ Present in clean bullet points (use • symbol only)
✅ Focus on what students need to learn/remember
✅ Organize by logical themes/topics
✅ Use clear, concise language
✅ Make key terms bold using **bold text** format
✅ No markdown headers or complex formatting

CHUNKS FROM VECTOR DATABASE:
${contextChunks}

RESPOND IN THIS EXACT JSON FORMAT:
{
  "summary": "2-3 sentence overview of the main content and purpose",
  "keyTopics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "structure": [
    {
      "heading": "Key Concepts",
      "content": "• **Concept Name:** Clear explanation\n• **Another Concept:** Brief details\n• **Third Concept:** Important points"
    },
    {
      "heading": "Main Points", 
      "content": "• **Point 1:** Detailed explanation\n• **Point 2:** Key information\n• **Point 3:** Essential details"
    },
    {
      "heading": "Important Details",
      "content": "• **Detail 1:** Explanation\n• **Detail 2:** Information\n• **Detail 3:** Key facts"
    }
  ]
}

FORMATTING RULES:
- Use • for all bullet points
- Use **text** for bold/important terms
- Use \n for line breaks in content
- Keep each bullet point concise but informative
- Return ONLY valid JSON, no additional text.`;

			// 4. GENERATE SUMMARY WITH GEMINI
			const result = await this.model.generateContent(summaryPrompt);
			const response = await result.response;
			const text = response.text();

			// 5. PARSE GEMINI RESPONSE
			let parsedSummary;
			try {
				// Extract JSON from response
				const jsonMatch = text.match(/\{[\s\S]*\}/);
				if (jsonMatch) {
					parsedSummary = JSON.parse(jsonMatch[0]);
				} else {
					throw new Error("No JSON found in Gemini response");
				}

				// Validate required fields
				if (!parsedSummary.summary || !parsedSummary.keyTopics || !parsedSummary.structure) {
					throw new Error("Invalid JSON structure from Gemini");
				}

			} catch (parseError) {
				console.warn("Failed to parse Gemini JSON response, creating fallback summary");
				
				// Fallback: create structured response from plain text
				const lines = text.split('\n').filter(line => line.trim());
				parsedSummary = {
					summary: `Summary of ${fileName} based on ${uniqueChunks.length} content chunks.`,
					keyTopics: ["Main Content", "Key Points", "Important Information"],
					structure: [
						{
							heading: "Content Summary",
							content: lines.slice(0, 10).map(line => `• ${line.trim()}`).join('\n')
						}
					]
				};
			}

			return parsedSummary;

		} catch (error) {
			console.error(`❌ Error generating golden summary for ${fileName}:`, error);
			throw error;
		}
	}

	/**
	 * Generate quick summary for immediate display using vector database chunks
	 */
	static async generateQuickSummary(
		fileId: string,
		fileName: string,
		workspaceId: string
	): Promise<string> {
		if (!this.initialized) {
			throw new Error("SummaryService not initialized");
		}

		try {
			// 1. RETRIEVE TOP CHUNKS FROM VECTOR DATABASE
			// Use multiple queries to get diverse, relevant content
			const searchQueries = [
				"main points overview summary",
				"key concepts important ideas",
				"conclusion findings results"
			];

			let allChunks: Array<{ pageContent: string; metadata: Record<string, unknown>; score: number }> = [];
			
			for (const query of searchQueries) {
				const chunks = await DocumentService.searchSimilarDocuments(query, workspaceId, 3);
				// Filter chunks that belong to this specific file
				const fileChunks = chunks.filter(chunk => 
					chunk.metadata && chunk.metadata.fileId === fileId
				);
				allChunks.push(...fileChunks);
			}

			// Remove duplicates and get optimal chunks for quick summary
			const allUniqueChunks = Array.from(
				new Map(allChunks.map(chunk => [chunk.pageContent.substring(0, 50), chunk])).values()
			)
			.sort((a, b) => b.score - a.score);

			if (allUniqueChunks.length === 0) {
				return "No content available for summary.";
			}

			// For quick summaries, use fewer chunks (about 1/3 of optimal)
			const quickChunkCount = Math.max(5, Math.floor(this.getOptimalChunkCount(allUniqueChunks.length) / 3));
			const uniqueChunks = allUniqueChunks.slice(0, quickChunkCount);

			// Using optimal chunks for quick summary

			// 2. PREPARE CONTEXT FROM CHUNKS
			const context = uniqueChunks
				.map((chunk, index) => `[${index + 1}] ${chunk.pageContent.trim()}`)
				.join("\n\n");

			// 3. GENERATE QUICK SUMMARY WITH GEMINI
			const quickPrompt = `You are creating a quick summary from document chunks.

TASK: Create a concise 2-3 sentence summary that captures the main essence of this content.

REQUIREMENTS:
- Focus on the most important points
- Remove redundancy between chunks
- Use clear, engaging language
- Make it informative but brief

CONTENT CHUNKS FROM "${fileName}":
${context}

QUICK SUMMARY:`;

			const result = await this.model.generateContent(quickPrompt);
			const response = await result.response;
			const summary = response.text().trim();

			return summary;

		} catch (error) {
			console.error(`❌ Error generating quick summary for ${fileName}:`, error);
			return "Unable to generate summary at this time.";
		}
	}

	/**
	 * Extract key topics from content
	 */
	static async extractKeyTopics(
		fileId: string,
		workspaceId: string,
		limit: number = 10
	): Promise<string[]> {
		if (!this.initialized) {
			throw new Error("SummaryService not initialized");
		}

		try {
			const chunks = await DocumentService.searchSimilarDocuments(
				"topics concepts themes subjects", 
				workspaceId, 
				10
			);

			const fileChunks = chunks.filter(chunk => 
				chunk.metadata && chunk.metadata.fileId === fileId
			);

			if (fileChunks.length === 0) {
				return [];
			}

			const context = fileChunks
				.map(chunk => chunk.pageContent)
				.join("\n\n");

			const topicsPrompt = `Extract the main topics/themes from this content. Return as a JSON array of strings (max ${limit} topics):

${context}

Topics:`;

			const result = await this.model.generateContent(topicsPrompt);
			const response = await result.response;
			const text = response.text();

			try {
				// Try to parse as JSON array
				const topics = JSON.parse(text);
				return Array.isArray(topics) ? topics.slice(0, limit) : [];
			} catch {
				// Fallback: extract topics from text
				const lines = text.split('\n').filter(line => line.trim());
				return lines.slice(0, limit).map(line => 
					line.replace(/^[-•*]\s*/, '').trim()
				);
			}

		} catch (error) {
			console.error("Error extracting key topics:", error);
			return [];
		}
	}
}
