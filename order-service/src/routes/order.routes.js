const express = require('express');
const { placeOrder } = require('../controllers/order.controller');

const router = express.Router();

// POST /api/orders
router.post('/', placeOrder);

module.exports = router;
