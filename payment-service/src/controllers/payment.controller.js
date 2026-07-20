const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { addTransferJob } = require('../queues/transferQueue');

const processPayment = async (req, res) => {
  try {
    const { amount, source, currency = 'usd', items = [] } = req.body;

    if (!amount || !source) {
      return res.status(400).json({ error: 'Amount and source (card token) are required' });
    }

    const charge = await stripe.charges.create({
      amount: Math.round(amount * 100),
      currency,
      source,
      description: 'eCommerce Order Checkout',
      transfer_group: `ORDER_${Date.now()}`
    });

    // Enqueue asynchronous jobs to process split payments
    for (const item of items) {
      if (item.sellerId && item.sellerId !== 'Orbit Official') {
        await addTransferJob({
          sellerId: item.sellerId,
          price: item.price,
          quantity: item.quantity,
          chargeId: charge.id,
          transferGroup: charge.transfer_group,
          currency: currency
        });
        console.log(`[Checkout] Enqueued transfer job for seller ${item.sellerId}`);
      }
    }

    res.status(200).json({
      success: true,
      chargeId: charge.id,
      status: charge.status,
    });

  } catch (error) {
    console.error('[Stripe Error]', error.message);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const axios = require('axios');

const onboardSeller = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
    let stripeAccountId = null;

    // 1. Try to get existing stripeAccountId from user-service
    try {
      const userRes = await axios.get(`${userServiceUrl}/${userId}/stripe-account`);
      stripeAccountId = userRes.data.stripeAccountId;
    } catch (err) {
      console.error('[Payment] Could not fetch existing stripe account', err.message);
    }

    // 2. If they don't have one, create a new connected account
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
      });
      stripeAccountId = account.id;

      // Save the new account ID in the user-service
      try {
        await axios.put(`${userServiceUrl}/${userId}/stripe-account`, {
          stripeAccountId
        });
      } catch (err) {
        console.error('[Payment] Failed to save Stripe Account to User Service', err.message);
        return res.status(500).json({ error: 'Failed to link account' });
      }
    }

    // 3. Create an account link for onboarding (resumes existing or starts new)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${frontendUrl}/seller-dashboard?error=refresh`,
      return_url: `${frontendUrl}/seller-dashboard?success=true`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (error) {
    console.error('[Stripe Onboarding Error]', error.message);
    res.status(500).json({ error: 'Failed to generate onboarding link' });
  }
};

const checkAccountStatus = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // 1. Get stripeAccountId from user-service
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
    const userRes = await axios.get(`${userServiceUrl}/${userId}/stripe-account`);
    const stripeAccountId = userRes.data.stripeAccountId;

    if (!stripeAccountId) {
      return res.json({ connected: false });
    }

    // 2. Check actual status
    const account = await stripe.accounts.retrieve(stripeAccountId);

    if (account.charges_enabled && account.details_submitted) {
      return res.json({ connected: true, stripeAccountId });
    } else {
      return res.json({ connected: false, stripeAccountId, pending: true });
    }
  } catch (error) {
    console.error('[Stripe Status Check Error]', error.message);
    res.status(500).json({ error: 'Failed to check account status' });
  }
};

module.exports = { processPayment, onboardSeller, checkAccountStatus };
