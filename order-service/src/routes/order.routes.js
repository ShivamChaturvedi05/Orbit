const express = require('express');
const { placeOrder, getUserOrders, verifyPurchase } = require('../controllers/order.controller');

const router = express.Router();

// POST /api/orders
router.post('/', placeOrder);

// GET /api/orders
router.get('/', getUserOrders);
router.get('/verify-purchase/:productId', verifyPurchase);

module.exports = router;
