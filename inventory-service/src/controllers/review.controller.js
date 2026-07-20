const Review = require('../models/review.model');
const Product = require('../models/product.model');

const addReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment, reviewerName } = req.body;

    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 1. Verify Purchase via Order Service
    const orderUrl = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';
    try {
      const verifyRes = await fetch(`${orderUrl}/verify-purchase/${productId}?userId=${userId}`);
      if (!verifyRes.ok) {
        throw new Error(`HTTP error! status: ${verifyRes.status}`);
      }
      const verifyData = await verifyRes.json();

      if (!verifyData.hasPurchased) {
        return res.status(403).json({ error: 'You must purchase this item before leaving a review.' });
      }
    } catch (err) {
      console.error('[Review] Failed to verify purchase:', err.message);
      return res.status(500).json({ error: 'Failed to verify purchase history.' });
    }

    // 2. Check if user already reviewed
    const existingReview = await Review.findOne({ productId, userId });
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this product.' });
    }

    // 3. Create the review
    const newReview = await Review.create({
      productId,
      userId,
      reviewerName: reviewerName || 'Orbit Customer',
      rating,
      comment
    });

    // 4. Recalculate average rating
    const allReviews = await Review.find({ productId });
    const totalRating = allReviews.reduce((sum, rev) => sum + rev.rating, 0);
    const averageRating = totalRating / allReviews.length;

    // 5. Update Product cache
    await Product.findByIdAndUpdate(productId, {
      averageRating: parseFloat(averageRating.toFixed(1)),
      reviewCount: allReviews.length
    });

    res.status(201).json({ message: 'Review added successfully', review: newReview });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ productId }).sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { addReview, getProductReviews };
