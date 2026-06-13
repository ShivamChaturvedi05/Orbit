const Joi = require('joi');
const Order = require('../models/order.model');
const { publishOrderMessage } = require('../rabbitmq/producer');

const orderSchema = Joi.object({
  productId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required()
});

const placeOrder = async (req, res) => {
  try {
    const { error } = orderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const userId = req.headers['x-user-id'] || '00000000-0000-0000-0000-000000000000';

    const { productId, quantity } = req.body;

    // 1. Create a PENDING order in PostgreSQL
    const order = await Order.create({
      userId,
      productId,
      quantity,
      status: 'PENDING'
    });

    // 2. Drop a tiny JSON message into the RabbitMQ Post Office
    await publishOrderMessage({
      orderId: order.id,
      productId: order.productId,
      quantity: order.quantity
    });

    // 3. Immediately respond to the user! We DO NOT wait for the Inventory Service.
    res.status(201).json({
      message: 'Order placed successfully and is pending inventory check.',
      order
    });

  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { placeOrder };
