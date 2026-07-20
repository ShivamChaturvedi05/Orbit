const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';

    for (const item of items) {
      if (item.sellerId && item.sellerId !== 'Orbit Official') {
        try {
          // Fetch the seller's Stripe Account ID from User Service
          const userRes = await axios.get(`${userServiceUrl}/${item.sellerId}/stripe-account`);
          const stripeAccountId = userRes.data.stripeAccountId;

          if (stripeAccountId) {
            // Calculate 90% seller cut
            const sellerCut = Math.round(item.price * item.quantity * 0.9 * 100);

            await stripe.transfers.create({
              amount: sellerCut,
              currency,
              destination: stripeAccountId,
              transfer_group: charge.transfer_group,
              source_transaction: charge.id
            });
            console.log(`[Stripe Connect] Transferred $${(sellerCut / 100).toFixed(2)} to ${stripeAccountId}`);
          } else {
            console.log(`[Stripe Connect] Seller ${item.sellerId} has no Stripe account. Platform keeps funds.`);
          }
        } catch (err) {
          console.error(`[Stripe Connect] Failed to transfer to seller ${item.sellerId}`, err.message);
        }
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

    // Create a new connected account
    const account = await stripe.accounts.create({
      type: 'express',
    });

    // Save the account ID in the user-service
    try {
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
      await axios.put(`${userServiceUrl}/${userId}/stripe-account`, {
        stripeAccountId: account.id
      });
    } catch (err) {
      console.error('[Payment] Failed to save Stripe Account to User Service', err);
      return res.status(500).json({ error: 'Failed to link account' });
    }

    // Create an account link for onboarding
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
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

module.exports = { processPayment, onboardSeller };
