const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const processPayment = async (req, res) => {
  try {
    const { amount, source, currency = 'usd' } = req.body;

    if (!amount || !source) {
      return res.status(400).json({ error: 'Amount and source (card token) are required' });
    }

    const charge = await stripe.charges.create({
      amount: Math.round(amount * 100),
      currency,
      source,
      description: 'eCommerce Order Checkout',
    });

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

module.exports = { processPayment };
