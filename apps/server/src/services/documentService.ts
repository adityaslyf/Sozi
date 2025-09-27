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
			await this.embeddings.embedQuery("test connection");

			// Initialize text splitter
			this.textSplitter = new RecursiveCharacterTextSplitter({
				chunkSize: 1000,
				chunkOverlap: 200,
				separators: ["\n\n", "\n", " ", ""],
			});

			this.initialized = true;
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
		// Check file size to determine processing strategy
		const stats = await fs.stat(filePath);
		const fileSizeMB = stats.size / (1024 * 1024);
		
		// For large files (>2MB), process page by page to avoid memory issues
		if (fileSizeMB > 2) {
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
		
		let allText = '';
		const batchSize = 10; // Process 10 pages at a time
		
		for (let i = 0; i < docs.length; i += batchSize) {
			const batch = docs.slice(i, i + batchSize);
			
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
		
		if (spacedRatio > 0.5) {
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
		const buffer = await fs.readFile(filePath);
		
		// Try HTML extraction first (better text quality)
		try {
			const htmlResult = await mammoth.convertToHtml({ buffer });
			
			// Convert HTML to plain text
			const text = htmlResult.value
				.replace(/<[^>]*>/g, ' ') // Remove HTML tags
				.replace(/&nbsp;/g, ' ')
				.replace(/&amp;/g, '&')
				.replace(/&lt;/g, '<')
				.replace(/&gt;/g, '>')
				.replace(/&quot;/g, '"')
				.replace(/&#39;/g, "'")
				.replace(/\s+/g, ' ') // Normalize whitespace
				.trim();
			
			// Check if text looks reasonable (mostly ASCII characters)
			const asciiChars = text.split('').filter(char => char.charCodeAt(0) <= 127);
			const asciiRatio = asciiChars.length / text.length;
			if (asciiRatio > 0.7 && text.length > 0) {
				return text;
			}
		} catch {
			// Fall through to raw text extraction
		}
		
		// Fallback to raw text extraction
		const result = await mammoth.extractRawText({ buffer });
		const text = result.value;
			
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
		
		// Extracting text from file
		
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

		// Processing document for embeddings

		try {
			// Extract text from file
			const text = await this.extractTextFromFile(filePath);
			
			if (text.trim().length === 0) {
				console.log(`⚠️ No text content found in ${fileName}`);
				return;
			}

		// Split text into chunks
		const docs = await this.textSplitter.createDocuments([text], [
			{
				source: fileName,
				fileId: fileId,
				workspaceId: workspaceId,
			}
		]);

		// Add metadata to each document
		const documentsWithMetadata = docs.map((doc, index) => ({
			...doc,
			metadata: {
				...doc.metadata,
				chunkIndex: index,
				totalChunks: docs.length,
			}
		}));

			// Store in Pinecone using the workspace as namespace
			if (!process.env.PINECONE_INDEX_NAME) {
				throw new Error("PINECONE_INDEX_NAME environment variable is required");
			}

			const index = this.pinecone.Index(process.env.PINECONE_INDEX_NAME);
			
		// Process documents in smaller batches to avoid timeouts
		const batchSize = 5; // Process 5 documents at a time for accuracy
		
		let successfulChunks = 0;
		let skippedChunks = 0;
		
		for (let i = 0; i < documentsWithMetadata.length; i += batchSize) {
			const batch = documentsWithMetadata.slice(i, i + batchSize);
			const batchNum = Math.floor(i/batchSize) + 1;
			
			try {
				// Validate batch content before processing
				const validBatch = await this.validateAndFilterBatch(batch, batchNum);
				
				if (validBatch.length === 0) {
					skippedChunks += batch.length;
					continue;
				}
				
				if (validBatch.length < batch.length) {
					skippedChunks += (batch.length - validBatch.length);
				}
				
				await PineconeStore.fromDocuments(
					validBatch,
					this.embeddings,
					{
						pineconeIndex: index,
						namespace: workspaceId,
					}
				);
				
				successfulChunks += validBatch.length;
				
				// Keep 2-second delay between batches for API rate limits and accuracy
				if (i + batchSize < documentsWithMetadata.length) {
					await new Promise(resolve => setTimeout(resolve, 2000));
				}
			} catch {
				// Try to process documents individually to identify problematic ones
				for (let j = 0; j < batch.length; j++) {
					const singleDoc = [batch[j]];
					try {
						// Validate single document
						const validDoc = await this.validateAndFilterBatch(singleDoc, `${batchNum}.${j+1}`);
						
						if (validDoc.length === 0) {
							skippedChunks++;
							continue;
						}
						
						await PineconeStore.fromDocuments(
							validDoc,
							this.embeddings,
							{
								pineconeIndex: index,
								namespace: workspaceId,
							}
						);
						
						successfulChunks++;
						
						// Small delay between individual documents
						await new Promise(resolve => setTimeout(resolve, 500));
					} catch {
						skippedChunks++;
					}
				}
			}
		}
		
		// Log processing results
		if (successfulChunks === 0) {
			throw new Error(`No chunks were successfully processed from ${fileName}`);
		}
		
		} catch (error) {
			console.error(`❌ Error processing document ${fileName}:`, error);
			throw error;
		}

		// Document processing completed
	}

	/**
	 * Validate and filter a batch of documents to ensure they can produce valid embeddings
	 */
	static async validateAndFilterBatch(
		batch: Array<{ pageContent: string; metadata: Record<string, unknown> }>,
		_batchId: string | number
	): Promise<Array<{ pageContent: string; metadata: Record<string, unknown> }>> {
		const validDocuments = [];
		
		for (let i = 0; i < batch.length; i++) {
			const doc = batch[i];
			
			// Check if document has valid content
			if (!doc.pageContent || typeof doc.pageContent !== 'string') {
				continue;
			}
			
			// Check content length (too short or too long can cause issues)
			const contentLength = doc.pageContent.trim().length;
			if (contentLength < 10) {
				continue;
			}
			
			if (contentLength > 8000) {
				doc.pageContent = doc.pageContent.substring(0, 8000);
			}
			
			// Check for problematic characters that might cause embedding issues
			let cleanContent = doc.pageContent;
			
			// Remove control characters and replacement characters
			cleanContent = cleanContent
				.split('')
				.filter(char => {
					const code = char.charCodeAt(0);
					// Keep printable characters (32-126) and common whitespace (9, 10, 13)
					return (code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13;
				})
				.join('')
				.replace(/\uFFFD/g, '') // Remove replacement characters
				.trim();
			
			if (cleanContent.length < 10) {
				continue;
			}
			
			// Test if content can generate a valid embedding (sample test)
			try {
				// For very problematic content, we can test a small sample
				const testContent = cleanContent.substring(0, 100);
				if (!/[a-zA-Z0-9]/.test(testContent)) {
					continue;
				}
				
				// Update document with cleaned content
				doc.pageContent = cleanContent;
				validDocuments.push(doc);
				
			} catch {
				continue;
			}
		}
		
		return validDocuments;
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
				return;
			}

			const index = this.pinecone.Index(process.env.PINECONE_INDEX_NAME);
			
			// Delete all vectors with this fileId
			await index.namespace(workspaceId).deleteMany({
				filter: { fileId: fileId }
			});
		} catch (error) {
			console.error("Error deleting document from Pinecone:", error);
			// Don't throw error - allow file deletion to continue even if Pinecone fails
		}
	}


}