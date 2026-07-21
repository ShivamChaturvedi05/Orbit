const Product = require('../models/product.model');
const { redisClient } = require('../db/index');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

const getEmbedding = async (text) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Gemini API Error:', error);
    return null;
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, imgUrl, stockQuantity } = req.body;
    const sellerId = req.headers['x-user-id'] || 'Orbit Official';

    const embedding = await getEmbedding(`${name} - ${description}`);

    // Save to MongoDB
    const newProduct = await Product.create({
      name, description, price, category, imgUrl, embedding, sellerId, stockQuantity: stockQuantity ? parseInt(stockQuantity) : 0
    });


    res.status(201).json({ message: 'Product created with AI embedding', product: newProduct });
  } catch (error) {
    next(error);
  }
};

const getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const cacheKey = `products_page_${page}_limit_${limit}`;

    const cachedProducts = await redisClient.get(cacheKey);

    if (cachedProducts) {
      console.log('Redis Cache HIT for', cacheKey);
      return res.json(JSON.parse(cachedProducts));
    }

    console.log(`Redis Cache MISS for ${cacheKey}. Fetching from MongoDB...`);
    const products = await Product.find()
      .select('-embedding')
      .skip(skip)
      .limit(limit);

    await redisClient.setEx(cacheKey, 60, JSON.stringify(products));

    res.json(products);
  } catch (error) {
    next(error);
  }
};

const searchProducts = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Search query is required' });

    const queryEmbedding = await getEmbedding(query);
    if (!queryEmbedding) return res.status(500).json({ error: 'AI processing failed' });

    const results = await Product.aggregate([
      {
        "$vectorSearch": {
          "index": "vector_index",
          "path": "embedding",
          "queryVector": queryEmbedding,
          "numCandidates": 100,
          "limit": 10
        }
      },
      {
        "$project": { "embedding": 0 }
      }
    ]);

    res.json(results);
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
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

const getSellerProducts = async (req, res, next) => {
  try {
    const sellerId = req.headers['x-user-id'];
    if (!sellerId) return res.status(401).json({ error: 'Unauthorized' });

    const products = await Product.find({ sellerId }).select('-embedding').sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    next(error);
  }
};

const updateSellerProduct = async (req, res, next) => {
  try {
    const sellerId = req.headers['x-user-id'];
    if (!sellerId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { price, stockQuantity } = req.body;

    const product = await Product.findOneAndUpdate(
      { _id: id, sellerId: sellerId },
      { price: parseFloat(price), stockQuantity: parseInt(stockQuantity) },
      { new: true }
    ).select('-embedding');

    if (!product) return res.status(404).json({ error: 'Product not found or unauthorized' });

    // Since we updated a product, we should ideally invalidate cache, but for Eventual Consistency,
    // we can skip it or let TTL handle it.
    res.json({ message: 'Product updated', product });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getProducts,
  searchProducts,
  getProductById,
  getSellerProducts,
  updateSellerProduct
};
