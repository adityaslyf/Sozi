#!/usr/bin/env node

/**
 * Pinecone Index Setup Script for Gemini Embeddings
 * 
 * This script creates a Pinecone index optimized for Gemini text-embedding-004
 * Dimensions: 768, Metric: cosine
 */

import { Pinecone } from '@pinecone-database/pinecone';
import 'dotenv/config';

const INDEX_NAME = 'sozi-embeddings';
const DIMENSIONS = 768; // Gemini text-embedding-004 dimensions
const METRIC = 'cosine'; // Best for text similarity

async function setupPineconeIndex() {
    try {
        console.log('🚀 Setting up Pinecone index for Gemini embeddings...');
        
        // Check for API key
        if (!process.env.PINECONE_API_KEY) {
            console.error('❌ PINECONE_API_KEY not found in environment variables');
            console.log('Please add PINECONE_API_KEY to your .env file');
            process.exit(1);
        }

        // Initialize Pinecone
        const pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });

        console.log('📋 Index Configuration:');
        console.log(`   Name: ${INDEX_NAME}`);
        console.log(`   Dimensions: ${DIMENSIONS} (Gemini text-embedding-004)`);
        console.log(`   Metric: ${METRIC}`);
        console.log('');

        // Check if index already exists
        console.log('🔍 Checking if index already exists...');
        const existingIndexes = await pinecone.listIndexes();
        const indexExists = existingIndexes.indexes?.some(index => index.name === INDEX_NAME);

        if (indexExists) {
            console.log('✅ Index already exists!');
            
            // Get index info
            const indexInfo = await pinecone.describeIndex(INDEX_NAME);
            console.log('📊 Current Index Info:');
            console.log(`   Status: ${indexInfo.status?.state}`);
            console.log(`   Dimensions: ${indexInfo.spec?.pod?.dimension || indexInfo.spec?.serverless?.dimension}`);
            console.log(`   Metric: ${indexInfo.spec?.pod?.metric || indexInfo.spec?.serverless?.metric}`);
            
            // Check if dimensions match
            const currentDimensions = indexInfo.spec?.pod?.dimension || indexInfo.spec?.serverless?.dimension;
            if (currentDimensions !== DIMENSIONS) {
                console.log('⚠️  WARNING: Index dimensions do not match Gemini embeddings!');
                console.log(`   Current: ${currentDimensions}, Required: ${DIMENSIONS}`);
                console.log('   You may need to delete and recreate the index.');
            } else {
                console.log('✅ Index dimensions are correct for Gemini embeddings!');
            }
            
            return;
        }

        // Create new index
        console.log('📝 Creating new Pinecone index...');
        
        await pinecone.createIndex({
            name: INDEX_NAME,
            dimension: DIMENSIONS,
            metric: METRIC,
            spec: {
                serverless: {
                    cloud: 'aws',
                    region: 'us-east-1'
                }
            }
        });

        console.log('⏳ Waiting for index to be ready...');
        
        // Wait for index to be ready
        let isReady = false;
        let attempts = 0;
        const maxAttempts = 30; // 5 minutes max
        
        while (!isReady && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
            
            try {
                const indexInfo = await pinecone.describeIndex(INDEX_NAME);
                isReady = indexInfo.status?.state === 'Ready';
                
                if (!isReady) {
                    console.log(`   Status: ${indexInfo.status?.state} (attempt ${attempts + 1}/${maxAttempts})`);
                }
            } catch (error) {
                console.log(`   Checking status... (attempt ${attempts + 1}/${maxAttempts})`);
            }
            
            attempts++;
        }

        if (isReady) {
            console.log('✅ Index created successfully!');
            console.log('');
            console.log('🎉 Pinecone setup complete!');
            console.log('');
            console.log('📝 Next steps:');
            console.log('1. Add your Google API key to .env file');
            console.log('2. Update PINECONE_INDEX_NAME in .env to: sozi-embeddings');
            console.log('3. Restart your server');
        } else {
            console.log('⚠️  Index creation timed out. Please check Pinecone console.');
        }

    } catch (error) {
        console.error('❌ Error setting up Pinecone index:', error);
        
        if (error.message?.includes('already exists')) {
            console.log('✅ Index already exists! You can proceed.');
        } else {
            console.log('');
            console.log('💡 Manual Setup Instructions:');
            console.log('1. Go to https://app.pinecone.io/');
            console.log('2. Click "Create Index"');
            console.log(`3. Name: ${INDEX_NAME}`);
            console.log(`4. Dimensions: ${DIMENSIONS}`);
            console.log(`5. Metric: ${METRIC}`);
            console.log('6. Choose your preferred cloud/region');
        }
    }
}

// Run the setup
setupPineconeIndex();
