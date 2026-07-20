const express = require('express');
const productController = require('../controllers/product.controller');
const reviewController = require('../controllers/review.controller');

const router = express.Router();

router.post('/', productController.createProduct);
router.get('/', productController.getProducts);
router.get('/search', productController.searchProducts);
router.get('/seller', productController.getSellerProducts);
router.put('/seller/:id', productController.updateSellerProduct);
router.get('/:id', productController.getProductById);

// Review routes
router.get('/:productId/reviews', reviewController.getProductReviews);
router.post('/:productId/reviews', reviewController.addReview);

module.exports = router;
