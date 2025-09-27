import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import fs from "fs-extra";
import path from "path";
import mammoth from "mammoth";

export class DocumentService {
	private static pinecone: Pinecone;
	private static embeddings: GoogleGenerativeAIEmbeddings;
	private static textSplitter: RecursiveCharacterTextSplitter;
	private static initialized: boolean = false;

	/**
	 * Initialize the document service with Gemini embeddings
	 */
	static async initialize() {
		try {
			// Check for required environment variables
			if (!process.env.PINECONE_API_KEY) {
				throw new Error("❌ PINECONE_API_KEY is required for document processing");
			}

			if (!process.env.GOOGLE_API_KEY) {
				throw new Error("❌ GOOGLE_API_KEY is required for Gemini embeddings");
			}

			console.log("🚀 Initializing DocumentService with Gemini embeddings...");

			// Initialize Pinecone using the latest v6 SDK pattern
			this.pinecone = new Pinecone({
				apiKey: process.env.PINECONE_API_KEY,
			});

			// Initialize Gemini embeddings
			this.embeddings = new GoogleGenerativeAIEmbeddings({
				apiKey: process.env.GOOGLE_API_KEY,
				model: "text-embedding-004", // Latest Gemini embedding model
			});

			// Test Gemini API connection
			console.log("🧪 Testing Gemini API connection...");
			await this.embeddings.embedQuery("test connection");
			console.log("✅ Gemini API connection successful");

			// Initialize text splitter
			this.textSplitter = new RecursiveCharacterTextSplitter({
				chunkSize: 1000,
				chunkOverlap: 200,
				separators: ["\n\n", "\n", " ", ""],
			});

			this.initialized = true;
			console.log("📄 Document service initialized successfully with Gemini embeddings");
		} catch (error) {
			console.error("❌ Failed to initialize document service:", error);
			throw error; // Don't allow fallback - fail fast
		}
	}

	/**
	 * Extract text from PDF file using LangChain PDFLoader with optimizations for large files
	 */
	static async extractTextFromPDF(filePath: string): Promise<string> {
		try {
			console.log(`📖 Attempting to extract text from PDF: ${filePath}`);
			
			// Check file size to determine processing strategy
			const stats = await fs.stat(filePath);
			const fileSizeMB = stats.size / (1024 * 1024);
			console.log(`📊 PDF file size: ${fileSizeMB.toFixed(2)} MB`);
			
			// For large files (>2MB), process page by page to avoid memory issues
			if (fileSizeMB > 2) {
				console.log(`🔄 Large file detected, using page-by-page processing...`);
				return await this.extractLargePDFText(filePath);
			}
			
			// Use standard processing for smaller files
			const loader = new PDFLoader(filePath, {
				splitPages: false, // Keep all pages together
				parsedItemSeparator: " ", // Use space to join text elements
			});
			
			const docs = await loader.load();
			let text = docs.map(doc => doc.pageContent).join(" ");
			
			// Clean up common PDF extraction artifacts
			text = this.cleanSpacedText(text);
			
			console.log(`📄 PDF extraction result: ${text.length} characters extracted`);
			console.log(`📄 Text preview (first 200 chars): "${text.substring(0, 200)}..."`);
			
			if (text.length === 0) {
				console.log(`⚠️ PDF appears to be empty or contains only images/scanned content`);
			}
			
			return text;
		} catch (error) {
			console.error("Error extracting text from PDF:", error);
			throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Extract text from large PDF files page by page to avoid memory issues
	 */
	static async extractLargePDFText(filePath: string): Promise<string> {
		try {
			// Process pages individually to reduce memory usage
			const loader = new PDFLoader(filePath, {
				splitPages: true, // Split into individual pages
				parsedItemSeparator: " ",
			});
			
			const docs = await loader.load();
			console.log(`📄 Processing ${docs.length} pages...`);
			
			let allText = '';
			const batchSize = 10; // Process 10 pages at a time
			
			for (let i = 0; i < docs.length; i += batchSize) {
				const batch = docs.slice(i, i + batchSize);
				console.log(`📖 Processing pages ${i + 1}-${Math.min(i + batchSize, docs.length)}/${docs.length}...`);
				
				// Extract text from this batch of pages
				const batchText = batch.map(doc => doc.pageContent).join(" ");
				allText += (allText ? " " : "") + batchText;
				
				// Small delay to prevent overwhelming the system
				if (i + batchSize < docs.length) {
					await new Promise(resolve => setTimeout(resolve, 100));
				}
			}
			
			// Clean up the combined text
			allText = this.cleanSpacedText(allText);
			
			console.log(`📄 Large PDF extraction result: ${allText.length} characters extracted`);
			console.log(`📄 Text preview (first 200 chars): "${allText.substring(0, 200)}..."`);
			
			return allText;
		} catch (error) {
			console.error("Error extracting text from large PDF:", error);
			throw new Error(`Failed to extract text from large PDF: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Clean text that has excessive spacing between characters
	 */
	static cleanSpacedText(text: string): string {
		// First, normalize all whitespace to single spaces
		text = text.replace(/\s+/g, ' ').trim();
		
		// Check if text has the spaced character pattern (more than 50% single char words)
		const words = text.split(' ');
		const singleCharWords = words.filter(word => word.length === 1 && /[a-zA-Z0-9]/.test(word));
		const spacedRatio = singleCharWords.length / words.length;
		
		console.log(`📊 Text analysis: ${singleCharWords.length}/${words.length} single chars (${Math.round(spacedRatio * 100)}%)`);
		
		if (spacedRatio > 0.5) {
			console.log(`🔧 Detected spaced text, attempting to reconstruct...`);
			
			// Reconstruct words by joining single characters
			const reconstructed = [];
			let currentWord = '';
			
			for (const word of words) {
				if (word.length === 1 && /[a-zA-Z0-9]/.test(word)) {
					// Single character - add to current word
					currentWord += word;
				} else {
					// Multi-character word or punctuation
					if (currentWord) {
						reconstructed.push(currentWord);
						currentWord = '';
					}
					if (word.trim()) {
						reconstructed.push(word);
					}
				}
			}
			
			// Don't forget the last word
			if (currentWord) {
				reconstructed.push(currentWord);
			}
			
			const result = reconstructed.join(' ');
			console.log(`✅ Text reconstruction: ${text.length} → ${result.length} chars`);
			return result;
		}
		
		// Text doesn't appear to be spaced, return as-is with basic cleanup
		return text
			.replace(/\s*\n\s*/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
	}

	/**
	 * Extract text from DOCX file
	 */
	static async extractTextFromDOCX(filePath: string): Promise<string> {
		try {
			console.log(`📖 Attempting to extract text from DOCX: ${filePath}`);
			const buffer = await fs.readFile(filePath);
			
			// Try HTML extraction first (better text quality)
			try {
				console.log(`🔄 Trying HTML extraction...`);
				const htmlResult = await mammoth.convertToHtml({ buffer });
				
				// Convert HTML to plain text
				let text = htmlResult.value
					.replace(/<[^>]*>/g, ' ') // Remove HTML tags
					.replace(/&nbsp;/g, ' ')
					.replace(/&amp;/g, '&')
					.replace(/&lt;/g, '<')
					.replace(/&gt;/g, '>')
					.replace(/&quot;/g, '"')
					.replace(/&#39;/g, "'")
					.replace(/\s+/g, ' ') // Normalize whitespace
					.trim();
				
				console.log(`📄 HTML extraction result: ${text.length} characters extracted`);
				console.log(`📄 Text preview (first 200 chars): "${text.substring(0, 200)}..."`);
				
				// Check if text looks reasonable (mostly ASCII characters)
				const asciiRatio = (text.match(/[\x00-\x7F]/g) || []).length / text.length;
				if (asciiRatio > 0.7 && text.length > 0) {
					console.log(`✅ HTML extraction successful (${Math.round(asciiRatio * 100)}% ASCII chars)`);
					return text;
				} else {
					console.log(`⚠️ HTML extraction text quality poor (${Math.round(asciiRatio * 100)}% ASCII chars), trying raw text...`);
				}
			} catch (htmlError) {
				console.log(`⚠️ HTML extraction failed:`, htmlError);
				console.log(`🔄 Falling back to raw text extraction...`);
			}
			
			// Fallback to raw text extraction
			const result = await mammoth.extractRawText({ buffer });
			const text = result.value;
			console.log(`📄 Raw text extraction result: ${text.length} characters extracted`);
			console.log(`📄 Text preview (first 200 chars): "${text.substring(0, 200)}..."`);
			
			if (text.length === 0) {
				console.log(`⚠️ DOCX appears to be empty`);
			}
			
			return text;
		} catch (error) {
			console.error("Error extracting text from DOCX:", error);
			throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Extract text from file based on extension
	 */
	static async extractTextFromFile(filePath: string): Promise<string> {
		const ext = path.extname(filePath).toLowerCase();
		
		console.log(`📁 Extracting text from file: ${filePath} (extension: ${ext || 'none'})`);
		
		switch (ext) {
			case '.pdf':
				return this.extractTextFromPDF(filePath);
			case '.docx':
				return this.extractTextFromDOCX(filePath);
			case '.txt':
				return fs.readFile(filePath, 'utf-8');
			default:
				throw new Error(`Unsupported file type: "${ext}" for file: ${filePath}`);
		}
	}

	/**
	 * Process document: extract text, chunk, embed, and store in Pinecone
	 */
	static async processDocument(
		filePath: string,
		fileName: string,
		fileId: string,
		workspaceId: string
	): Promise<void> {
		if (!this.initialized) {
			throw new Error("DocumentService not initialized");
		}

		console.log(`📄 Processing document: ${fileName}`);

		try {
			// Extract text from file
			const text = await this.extractTextFromFile(filePath);
			
			if (text.trim().length === 0) {
				console.log(`⚠️ No text content found in ${fileName}`);
				return;
			}

			console.log(`📝 Extracted ${text.length} characters from ${fileName}`);

			// Split text into chunks
			const docs = await this.textSplitter.createDocuments([text], [
				{
					source: fileName,
					fileId: fileId,
					workspaceId: workspaceId,
				}
			]);

			console.log(`✂️ Split into ${docs.length} chunks`);

			if (docs.length > 0) {
				console.log(`📄 First chunk preview (${docs[0].pageContent.length} chars):`);
				console.log(`"${docs[0].pageContent.substring(0, 200)}..."`);
			}

			// Create embeddings and store in Pinecone
			console.log(`🔄 Starting Gemini embedding process for ${fileName}...`);
			
			// Add metadata to each document
			const documentsWithMetadata = docs.map((doc, index) => ({
				...doc,
				metadata: {
					...doc.metadata,
					chunkIndex: index,
					totalChunks: docs.length,
				}
			}));

			console.log(`📦 Created ${documentsWithMetadata.length} document objects, starting Pinecone storage...`);

			// Store in Pinecone using the workspace as namespace
			if (!process.env.PINECONE_INDEX_NAME) {
				throw new Error("PINECONE_INDEX_NAME environment variable is required");
			}

			const index = this.pinecone.Index(process.env.PINECONE_INDEX_NAME);
			
			// Process documents in smaller batches to avoid timeouts
			const batchSize = 5; // Process 5 documents at a time for accuracy
			const totalBatches = Math.ceil(documentsWithMetadata.length / batchSize);
			const estimatedTimeMs = (totalBatches * 4000) + ((totalBatches - 1) * 2000); // 4s per batch + 2s delays
			
			console.log(`📦 Processing ${documentsWithMetadata.length} documents in ${totalBatches} batches of ${batchSize}...`);
			console.log(`⏱️ Estimated processing time: ${Math.round(estimatedTimeMs/1000)}s (${Math.round(estimatedTimeMs/60000)} minutes)`);
			
			for (let i = 0; i < documentsWithMetadata.length; i += batchSize) {
				const batch = documentsWithMetadata.slice(i, i + batchSize);
				const batchNum = Math.floor(i/batchSize) + 1;
				console.log(`🔄 Processing batch ${batchNum}/${totalBatches} (${batch.length} documents)...`);
				
				try {
					await PineconeStore.fromDocuments(
						batch,
						this.embeddings,
						{
							pineconeIndex: index,
							namespace: workspaceId,
						}
					);
					console.log(`✅ Batch ${batchNum} completed successfully`);
					
					// Keep 2-second delay between batches for API rate limits and accuracy
					if (i + batchSize < documentsWithMetadata.length) {
						console.log(`⏳ Waiting 2 seconds before next batch...`);
						await new Promise(resolve => setTimeout(resolve, 2000));
					}
				} catch (batchError) {
					console.error(`❌ Error processing batch ${batchNum}:`, batchError);
					throw batchError;
				}
			}

			console.log(`🚀 Successfully stored ${documentsWithMetadata.length} chunks in Pinecone for ${fileName}`);
		} catch (error) {
			console.error(`❌ Error processing document ${fileName}:`, error);
			throw error;
		}

		console.log(`✅ Document processing completed for ${fileName}`);
	}

	/**
	 * Search for similar documents using vector similarity
	 */
	static async searchSimilarDocuments(
		query: string,
		workspaceId: string,
		limit: number = 5
	): Promise<Array<{ pageContent: string; metadata: Record<string, unknown>; score: number }>> {
		if (!this.initialized) {
			throw new Error("DocumentService not initialized");
		}

		console.log(`🔍 Searching for: "${query}" in workspace ${workspaceId}`);

		try {
			if (!process.env.PINECONE_INDEX_NAME) {
				throw new Error("PINECONE_INDEX_NAME environment variable is required");
			}

			const index = this.pinecone.Index(process.env.PINECONE_INDEX_NAME);
			
			const vectorStore = new PineconeStore(this.embeddings, {
				pineconeIndex: index,
				namespace: workspaceId,
			});

			const results = await vectorStore.similaritySearchWithScore(query, limit);
			
			console.log(`✅ Found ${results.length} similar documents`);
			
			return results.map(([doc, score]) => ({
				...doc,
				score,
			}));
		} catch (error) {
			console.error("❌ Error searching documents:", error);
			throw error;
		}
	}

	/**
	 * Delete document chunks from Pinecone
	 */
	static async deleteDocumentFromPinecone(fileId: string, workspaceId: string): Promise<void> {
		try {
			// Check if Pinecone is properly initialized
			if (!this.pinecone || !process.env.PINECONE_INDEX_NAME) {
				console.log(`⚠️ Pinecone not configured, skipping vector deletion for file ${fileId}`);
				return;
			}

			const index = this.pinecone.Index(process.env.PINECONE_INDEX_NAME);
			
			// Delete all vectors with this fileId
			await index.namespace(workspaceId).deleteMany({
				filter: { fileId: fileId }
			});

			console.log(`🗑️ Deleted document chunks for file ${fileId} from Pinecone`);
		} catch (error) {
			console.error("Error deleting document from Pinecone:", error);
			// Don't throw error - allow file deletion to continue even if Pinecone fails
			console.log(`⚠️ Continuing with file deletion despite Pinecone error`);
		}
	}

	/**
	 * Get document statistics from Pinecone
	 */
	static async getDocumentStats(): Promise<Record<string, unknown>> {
		try {
			if (!this.pinecone || !process.env.PINECONE_INDEX_NAME) {
				return { error: "Pinecone not configured" };
			}

			const index = this.pinecone.Index(process.env.PINECONE_INDEX_NAME);
			const stats = await index.describeIndexStats();
			
			return {
				totalVectors: stats.totalRecordCount,
				namespaces: stats.namespaces,
				dimension: stats.dimension,
			};
		} catch (error) {
			console.error("Error getting document stats:", error);
			return { error: error instanceof Error ? error.message : String(error) };
		}
	}

	/**
	 * Inspect stored chunks in Pinecone for debugging
	 */
	static async inspectStoredChunks(workspaceId: string, limit: number = 10): Promise<any[]> {
		if (!this.initialized) {
			throw new Error("DocumentService not initialized");
		}

		try {
			if (!process.env.PINECONE_INDEX_NAME) {
				throw new Error("PINECONE_INDEX_NAME environment variable is required");
			}

			const index = this.pinecone.Index(process.env.PINECONE_INDEX_NAME);
			
			// Query with a generic vector to get some results
			const queryVector = new Array(768).fill(0.1); // Create a dummy vector
			
			const queryResponse = await index.query({
				vector: queryVector,
				topK: limit,
				namespace: workspaceId,
				includeMetadata: true,
			});

			return queryResponse.matches?.map(match => ({
				id: match.id,
				score: match.score,
				metadata: match.metadata,
				// Note: Pinecone doesn't return the original text content in query results
				// The text content is stored in the metadata
			})) || [];
		} catch (error) {
			console.error("Error inspecting stored chunks:", error instanceof Error ? error.message : String(error));
			throw error;
		}
	}

	/**
	 * Test search with sample queries to verify content quality
	 */
	static async testSearchQuality(workspaceId: string): Promise<any> {
		if (!this.initialized) {
			throw new Error("DocumentService not initialized");
		}

		const testQueries = [
			"What is this document about?",
			"company name",
			"date",
			"important information"
		];

		const results = [];

		for (const query of testQueries) {
			try {
				console.log(`🔍 Testing search for: "${query}"`);
				const searchResults = await this.searchSimilarDocuments(query, workspaceId, 3);
				
				results.push({
					query,
					resultCount: searchResults.length,
					results: searchResults.map(result => ({
						score: result.score,
						preview: result.pageContent.substring(0, 200) + "...",
						metadata: result.metadata
					}))
				});
			} catch (error) {
				console.error(`Error testing query "${query}":`, error);
				results.push({
					query,
					error: error instanceof Error ? error.message : String(error)
				});
			}
		}

		return results;
	}
}