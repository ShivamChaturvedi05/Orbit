const express = require('express');
const { processPayment, onboardSeller, checkAccountStatus } = require('../controllers/payment.controller');

const router = express.Router();

// POST /api/payments/charge
router.post('/charge', processPayment);
router.post('/onboard', onboardSeller);
router.get('/account-status', checkAccountStatus);

module.exports = router;
