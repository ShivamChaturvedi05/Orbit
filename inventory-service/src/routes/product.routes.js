const express = require('express');
const productController = require('../controllers/product.controller');

const router = express.Router();

router.post('/', productController.createProduct);
router.get('/', productController.getProducts);
router.get('/search', productController.searchProducts);
router.get('/seller', productController.getSellerProducts);
router.put('/seller/:id', productController.updateSellerProduct);
router.get('/:id', productController.getProductById);

module.exports = router;
