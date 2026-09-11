const express = require('express');
const { processPayment, onboardSeller, checkAccountStatus, refundPayment } = require('../controllers/payment.controller');

const router = express.Router();

// POST /api/payments/charge
router.post('/charge', processPayment);
router.post('/refund', refundPayment);
router.post('/onboard', onboardSeller);
router.get('/account-status', checkAccountStatus);

module.exports = router;
