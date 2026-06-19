const Joi = require('joi');
const axios = require('axios');
const Order = require('../models/order.model');
const { publishOrderMessage } = require('../rabbitmq/producer');

// We added stripeToken to the required payload!
const orderSchema = Joi.object({
  productId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
  stripeToken: Joi.string().required()
});

const placeOrder = async (req, res) => {
  try {
    const { error } = orderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const userId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    const { productId, quantity, stripeToken } = req.body;

    // Fetch product details from Inventory Service to get the actual price
    let productPrice;
    try {
      const inventoryUrl = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3002';
      const inventoryResponse = await axios.get(`${inventoryUrl}/api/inventory/${productId}`);
      productPrice = inventoryResponse.data.price;
    } catch (inventoryError) {
      console.error('[Order] Failed to fetch product from Inventory Service:', inventoryError.message);
      return res.status(404).json({ error: 'Product not found or Inventory Service unavailable' });
    }

    const totalAmount = quantity * productPrice;

    // --- NEW SYNCHRONOUS PAYMENT LOGIC ---
    try {
      console.log(`[Order] Processing payment of $${totalAmount} via Payment Service...`);
      const paymentUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004';
      const paymentResponse = await axios.post(`${paymentUrl}/api/payments/charge`, {
        amount: totalAmount,
        source: stripeToken
      });
      console.log(`[Order] Payment Successful! Charge ID: ${paymentResponse.data.chargeId}`);
    } catch (paymentError) {
      console.error('[Order] Payment Failed:', paymentError.response?.data?.error || paymentError.message);
      // STOP THE CHECKOUT! Do not save the order, do not alert RabbitMQ.
      return res.status(402).json({
        error: 'Payment Failed: Your card was declined.',
        details: paymentError.response?.data?.error
      });
    }

    // 1. Create a PAID order in PostgreSQL
    const order = await Order.create({
      userId,
      productId,
      quantity,
      status: 'COMPLETED'
    });

    // 2. Drop a tiny JSON message into the RabbitMQ Post Office for inventory fulfillment
    await publishOrderMessage({
      orderId: order.id,
      productId: order.productId,
      quantity: order.quantity
    });

    // 3. Respond to the user
    res.status(201).json({
      message: 'Payment successful! Order confirmed and sent for fulfillment.',
      order
    });

  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { placeOrder };
