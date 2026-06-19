const Joi = require('joi');
const axios = require('axios');
const Order = require('../models/order.model');
const { publishOrderMessage } = require('../rabbitmq/producer');

const orderSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required()
    })
  ).min(1).required(),
  stripeToken: Joi.string().required()
});

const placeOrder = async (req, res) => {
  try {
    const { error } = orderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const userId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';
    const { items, stripeToken } = req.body;

    let totalAmount = 0;
    const itemsWithPrices = [];

    // Fetch product details from Inventory Service for each item
    try {
      const inventoryUrl = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3002';

      for (const item of items) {
        const inventoryResponse = await axios.get(`${inventoryUrl}/api/inventory/${item.productId}`);
        const product = inventoryResponse.data;

        if (product.stockQuantity < item.quantity) {
          return res.status(400).json({ error: `Not enough stock for product: ${product.name}. Available: ${product.stockQuantity}` });
        }

        const price = product.price;
        totalAmount += price * item.quantity;
        itemsWithPrices.push({
          productId: item.productId,
          name: product.name,
          imgUrl: product.imgUrl,
          quantity: item.quantity,
          price: price
        });
      }
    } catch (inventoryError) {
      console.error('[Order] Failed to fetch products from Inventory Service:', inventoryError.message);
      return res.status(404).json({ error: 'One or more products not found or Inventory Service unavailable' });
    }

    // Process payment
    try {
      console.log(`[Order] Processing payment of $${totalAmount.toFixed(2)} via Payment Service...`);
      const paymentUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004';
      const paymentResponse = await axios.post(`${paymentUrl}/api/payments/charge`, {
        amount: totalAmount,
        source: stripeToken
      });
      console.log(`[Order] Payment Successful! Charge ID: ${paymentResponse.data.chargeId}`);
    } catch (paymentError) {
      console.error('[Order] Payment Failed:', paymentError.response?.data?.error || paymentError.message);
      return res.status(402).json({
        error: 'Payment Failed: Your card was declined.',
        details: paymentError.response?.data?.error
      });
    }

    // 1. Created a PAID order in PostgreSQL with JSONB items array
    const order = await Order.create({
      userId,
      items: itemsWithPrices,
      status: 'COMPLETED'
    });

    // 2. Drop a RabbitMQ message for EACH item so inventory can deduct stock
    for (const item of itemsWithPrices) {
      await publishOrderMessage({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity
      });
    }

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

const getUserOrders = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User ID missing' });
    }

    const orders = await Order.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { placeOrder, getUserOrders };
