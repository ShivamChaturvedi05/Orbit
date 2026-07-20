const express = require('express');
const { registerUser, loginUser, refreshUserToken, logoutUser, updateStripeAccount, getUserStripeAccount } = require('../controllers/user.controller');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refreshUserToken);
router.post('/logout', logoutUser);

// Internal routes (called by payment-service / order-service)
router.put('/:id/stripe-account', updateStripeAccount);
router.get('/:id/stripe-account', getUserStripeAccount);

module.exports = router;
