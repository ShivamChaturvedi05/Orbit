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
          
          // Deduct from stock
          const product = await Product.findByIdAndUpdate(
            productId, 
            { $inc: { stockQuantity: -quantity } },
            { new: true } // Returns the newly updated document
          );

          if (product) {
            console.log(`[RabbitMQ] ✅ Stock updated for "${product.name}"! New stock: ${product.stockQuantity}`);
            // Acknowledge that we successfully processed the message!
            channel.ack(msg);
          } else {
            console.error(`[RabbitMQ] ❌ Product not found! Order ID: ${orderData.orderId}`);
            // We ack the message so it doesn't get stuck forever in the queue
            channel.ack(msg);
          }
          
        } catch (error) {
          console.error('[RabbitMQ] Error processing message:', error);
          // If the database crashes, we DO NOT acknowledge the message!
          // RabbitMQ will safely keep it in the queue and try again later.
        }
      }
    });
    
  } catch (error) {
    console.error('Failed to connect RabbitMQ in Inventory Service:', error);
  }
};

module.exports = { startRabbitMQConsumer };
