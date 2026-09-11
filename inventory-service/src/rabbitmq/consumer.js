const amqp = require('amqplib');
const Product = require('../models/product.model');

const { publishFailedDeductionEvent } = require('./producer');

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

          const { orderId, chargeId, items } = orderData;
          const successfulItems = [];
          let failed = false;

          // Attempt to deduct stock for each item atomically
          for (const item of items) {
            const product = await Product.findOneAndUpdate(
              { _id: item.productId, stockQuantity: { $gte: item.quantity } },
              { $inc: { stockQuantity: -item.quantity, salesCount: item.quantity } },
              { new: true }
            );

            if (product) {
              console.log(`[RabbitMQ] Stock deducted for "${product.name}". New stock: ${product.stockQuantity}`);
              successfulItems.push(item);
            } else {
              console.error(`[RabbitMQ] Out of stock or product not found for ID: ${item.productId}`);
              failed = true;
              break;
            }
          }

          if (failed) {
            console.log(`[RabbitMQ] Order ${orderId} failed due to insufficient stock. Rolling back...`);
            // Rollback successful items
            for (const item of successfulItems) {
              await Product.findByIdAndUpdate(
                item.productId,
                { $inc: { stockQuantity: item.quantity, salesCount: -item.quantity } }
              );
            }
            
            // Trigger compensating transaction via RabbitMQ
            await publishFailedDeductionEvent({ orderId, chargeId });
          } else {
            console.log(`[RabbitMQ] Order ${orderId} successfully processed by Inventory!`);
          }

          channel.ack(msg);
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
