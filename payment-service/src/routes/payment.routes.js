const express = require('express');
const { processPayment, onboardSeller } = require('../controllers/payment.controller');

const router = express.Router();

// POST /api/payments/charge
router.post('/charge', processPayment);
router.post('/onboard', onboardSeller);

module.exports = router;
