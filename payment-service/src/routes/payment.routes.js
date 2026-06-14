const express = require('express');
const { processPayment } = require('../controllers/payment.controller');

const router = express.Router();

// POST /api/payments/charge
router.post('/charge', processPayment);

module.exports = router;
