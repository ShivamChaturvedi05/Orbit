const amqp = require('amqplib');
const Product = require('../models/product.model');

const startRabbitMQConsumer = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();

    const queue = 'ORDER_CREATED_QUEUE';
    await channel.assertQueue(queue);

    console.log(`RabbitMQ Consumer listening on ${queue}...`);

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        try {
          const orderData = JSON.parse(msg.content.toString());
          console.log(`\n[RabbitMQ] Received new order request!`, orderData);

          const { productId, quantity } = orderData;

          // Deduct from stock and increment salesCount atomically
          const product = await Product.findByIdAndUpdate(
            productId,
            { $inc: { stockQuantity: -quantity, salesCount: quantity } },
            { new: true }
          );

          if (product) {
            console.log(`[RabbitMQ] Stock updated for "${product.name}"! New stock: ${product.stockQuantity}`);
            channel.ack(msg);
          } else {
            console.error(`[RabbitMQ] Product not found! Order ID: ${orderData.orderId}`);
            channel.ack(msg);
          }

        } catch (error) {
          console.error('[RabbitMQ] Error processing message:', error);
        }
      }
    });

  } catch (error) {
    console.error('Failed to connect RabbitMQ in Inventory Service:', error);
  }
};

module.exports = { startRabbitMQConsumer };
