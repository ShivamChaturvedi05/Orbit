const express = require('express');
const { placeOrder, getUserOrders } = require('../controllers/order.controller');

const router = express.Router();

// POST /api/orders
router.post('/', placeOrder);

// GET /api/orders
router.get('/', getUserOrders);

module.exports = router;
