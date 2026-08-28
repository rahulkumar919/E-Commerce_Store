/**
 * AI Chatbot Test Script
 * Tests both MongoDB and Pinecone RAG systems
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('\n🧪 AI CHATBOT DIAGNOSTIC TEST\n');
console.log('=' .repeat(60));

// Test 1: Environment Variables
console.log('\n📋 TEST 1: Environment Variables');
console.log('-'.repeat(60));

const envVars = {
    'GEMINI_API_KEY': process.env.GEMINI_API_KEY,
    'PINECONE_API_KEY': process.env.PINECONE_API_KEY,
    'PINECONE_INDEX_NAME': process.env.PINECONE_INDEX_NAME,
    'MONGODB_URI': process.env.MONGODB_URI,
};

let allEnvVarsPresent = true;
for (const [key, value] of Object.entries(envVars)) {
    const status = value ? '✅ Found' : '❌ Missing';
    console.log(`${key}: ${status}`);
    if (!value) allEnvVarsPresent = false;
}

if (!allEnvVarsPresent) {
    console.log('\n❌ Some environment variables are missing!');
    process.exit(1);
}

// Test 2: MongoDB Connection
async function testMongoDB() {
    console.log('\n📋 TEST 2: MongoDB Connection');
    console.log('-'.repeat(60));
    
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected successfully');
        
        // Check if knowledge chunks exist
        const KnowledgeChunk = require('../models/knowledgeChunkModel');
        const count = await KnowledgeChunk.countDocuments();
        console.log(`✅ Knowledge chunks in database: ${count}`);
        
        if (count === 0) {
            console.log('⚠️  Warning: No knowledge chunks found. Run: npm run setup-rag');
        }
        
        return true;
    } catch (error) {
        console.log('❌ MongoDB connection failed:', error.message);
        return false;
    }
}

// Test 3: Gemini API
async function testGeminiAPI() {
    console.log('\n📋 TEST 3: Gemini API');
    console.log('-'.repeat(60));
    
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        console.log('🔄 Testing Gemini API with a simple query...');
        const result = await model.generateContent("Say 'Hello' in one word");
        const response = await result.response;
        const text = response.text();
        
        console.log('✅ Gemini API is working!');
        console.log(`   Response: "${text}"`);
        return true;
    } catch (error) {
        console.log('❌ Gemini API test failed:', error.message);
        return false;
    }
}

// Test 4: Pinecone Connection
async function testPinecone() {
    console.log('\n📋 TEST 4: Pinecone Connection');
    console.log('-'.repeat(60));
    
    try {
        const { Pinecone } = require('@pinecone-database/pinecone');
        const pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });
        
        console.log('🔄 Connecting to Pinecone...');
        const index = pinecone.index(process.env.PINECONE_INDEX_NAME);
        
        // Try to get index stats
        const stats = await index.describeIndexStats();
        console.log('✅ Pinecone connected successfully');
        console.log(`   Index: ${process.env.PINECONE_INDEX_NAME}`);
        console.log(`   Total vectors: ${stats.totalRecordCount || 0}`);
        
        if (stats.totalRecordCount === 0) {
            console.log('⚠️  Warning: No vectors in Pinecone. Run: npm run setup-rag-pinecone');
        }
        
        return true;
    } catch (error) {
        console.log('❌ Pinecone connection failed:', error.message);
        console.log('   This is OK if you want to use MongoDB instead');
        return false;
    }
}

// Test 5: MongoDB RAG System
async function testMongoDBRAG() {
    console.log('\n📋 TEST 5: MongoDB RAG System');
    console.log('-'.repeat(60));
    
    try {
        const { generateRAGResponse } = require('../services/ragService');
        const KnowledgeChunk = require('../models/knowledgeChunkModel');
        const productModel = require('../models/productModel');
        
        console.log('🔄 Testing MongoDB RAG with query: "immunity ke liye kya khaye?"');
        
        const response = await generateRAGResponse(
            "immunity ke liye kya khaye?",
            KnowledgeChunk,
            productModel
        );
        
        if (response.success) {
            console.log('✅ MongoDB RAG is working!');
            console.log(`   Intent detected: ${response.intent}`);
            console.log(`   Products recommended: ${response.recommendedProducts.length}`);
            console.log(`   AI Response: "${response.message.substring(0, 100)}..."`);
            return true;
        } else {
            console.log('❌ MongoDB RAG failed:', response.message);
            return false;
        }
    } catch (error) {
        console.log('❌ MongoDB RAG test failed:', error.message);
        return false;
    }
}

// Test 6: Pinecone RAG System
async function testPineconeRAG() {
    console.log('\n📋 TEST 6: Pinecone RAG System');
    console.log('-'.repeat(60));
    
    try {
        const { generateRAGResponsePinecone } = require('../services/ragServicePinecone');
        const productModel = require('../models/productModel');
        
        console.log('🔄 Testing Pinecone RAG with query: "immunity ke liye kya khaye?"');
        
        const response = await generateRAGResponsePinecone(
            "immunity ke liye kya khaye?",
            productModel
        );
        
        if (response.success) {
            console.log('✅ Pinecone RAG is working!');
            console.log(`   Intent detected: ${response.intent}`);
            console.log(`   Products recommended: ${response.recommendedProducts.length}`);
            console.log(`   AI Response: "${response.message.substring(0, 100)}..."`);
            return true;
        } else {
            console.log('❌ Pinecone RAG failed:', response.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Pinecone RAG test failed:', error.message);
        console.log('   This is OK if you want to use MongoDB instead');
        return false;
    }
}

// Run all tests
async function runAllTests() {
    const results = {
        mongodb: false,
        gemini: false,
        pinecone: false,
        mongodbRAG: false,
        pineconeRAG: false,
    };
    
    results.mongodb = await testMongoDB();
    results.gemini = await testGeminiAPI();
    results.pinecone = await testPinecone();
    
    if (results.mongodb && results.gemini) {
        results.mongodbRAG = await testMongoDBRAG();
    }
    
    if (results.pinecone && results.gemini) {
        results.pineconeRAG = await testPineconeRAG();
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`MongoDB Connection:     ${results.mongodb ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Gemini API:             ${results.gemini ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Pinecone Connection:    ${results.pinecone ? '✅ PASS' : '⚠️  SKIP'}`);
    console.log(`MongoDB RAG System:     ${results.mongodbRAG ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Pinecone RAG System:    ${results.pineconeRAG ? '✅ PASS' : '⚠️  SKIP'}`);
    
    console.log('\n' + '='.repeat(60));
    
    if (results.mongodbRAG || results.pineconeRAG) {
        console.log('🎉 SUCCESS! Your AI chatbot is working!');
        console.log('\n📝 Next Steps:');
        console.log('   1. Start backend: npm start');
        console.log('   2. Start frontend: cd ../my-app && npm run dev');
        console.log('   3. Open: http://localhost:5173');
        console.log('   4. Click the purple AI button (bottom-right)');
        console.log('   5. Try: "immunity ke liye kya khaye?"');
    } else {
        console.log('❌ AI chatbot is not working properly');
        console.log('\n🔧 Troubleshooting:');
        
        if (!results.mongodb) {
            console.log('   • Check MongoDB connection string in .env');
        }
        if (!results.gemini) {
            console.log('   • Check GEMINI_API_KEY in .env');
            console.log('   • Get key from: https://makersuite.google.com/app/apikey');
        }
        if (!results.mongodbRAG) {
            console.log('   • Run: npm run setup-rag (to process knowledge base)');
        }
    }
    
    console.log('\n');
    
    await mongoose.disconnect();
    process.exit(results.mongodbRAG || results.pineconeRAG ? 0 : 1);
}

runAllTests().catch(error => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
});
