const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  reviewerName: {
    type: String,
    default: 'Orbit Customer'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
  }
}, { timestamps: true });

// 1 user 1 review
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
