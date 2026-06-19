const Product = require('../models/product.model');
const { redisClient } = require('../db/index');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

// Helper function to get Vector Embedding from Gemini
const getEmbedding = async (text) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const result = await model.embedContent(text);
    return result.embedding.values; // Returns an array of numbers
  } catch (error) {
    console.error('Gemini API Error:', error);
    return null; // Fallback if API fails
  }
};

// --- 1. Create Product ---
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category } = req.body;

    // Call Gemini to understand the product
    const embedding = await getEmbedding(`${name} - ${description}`);

    // Save to MongoDB
    const newProduct = await Product.create({
      name, description, price, category, embedding
    });

    // Invalidate Redis cache because the product list changed!
    await redisClient.del('all_products');

    res.status(201).json({ message: 'Product created with AI embedding', product: newProduct });
  } catch (error) {
    next(error);
  }
};

// --- 2. Get All Products (Cache-Aside Pattern with Pagination) ---
exports.getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const cacheKey = `products_page_${page}_limit_${limit}`;

    // Check Redis first
    const cachedProducts = await redisClient.get(cacheKey);

    if (cachedProducts) {
      console.log('⚡ Redis Cache HIT for', cacheKey);
      return res.json(JSON.parse(cachedProducts));
    }

    console.log(`Redis Cache MISS for ${cacheKey}. Fetching from MongoDB...`);
    // If not in cache, fetch from MongoDB (ignoring the massive embedding array to save bandwidth)
    const products = await Product.find()
      .select('-embedding')
      .skip(skip)
      .limit(limit);

    // Save to Redis for 60 seconds (Time To Live)
    await redisClient.setEx(cacheKey, 60, JSON.stringify(products));

    res.json(products);
  } catch (error) {
    next(error);
  }
};

// --- 3. Semantic Search (The ML Engine) ---
exports.searchProducts = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Search query is required' });

    // Step 1: Turn the user's search phrase into math
    const queryEmbedding = await getEmbedding(query);
    if (!queryEmbedding) return res.status(500).json({ error: 'AI processing failed' });

    // Step 2: Ask MongoDB to find products mathematically similar to the query
    const results = await Product.aggregate([
      {
        "$vectorSearch": {
          "index": "vector_index", // This index must be created in MongoDB Atlas UI
          "path": "embedding",
          "queryVector": queryEmbedding,
          "numCandidates": 100, // Look at 100 closest
          "limit": 10          // Return the top limit
        }
      },
      {
        // Don't send the massive array back to the frontend
        "$project": { "embedding": 0 }
      }
    ]);

    res.json(results);
  } catch (error) {
    next(error);
  }
};

// --- 4. Get Product By ID ---
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).select('-embedding');
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
};
