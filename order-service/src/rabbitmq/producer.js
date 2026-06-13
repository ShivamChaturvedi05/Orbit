const amqp = require('amqplib');
require('dotenv').config();

let channel = null;

const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    
    // "Assert" means: "Create this queue if it doesn't exist yet."
    await channel.assertQueue('ORDER_CREATED_QUEUE');
    
    console.log('RabbitMQ Producer Connected for Order Service...');
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    process.exit(1);
  }
};

const publishOrderMessage = async (orderData) => {
  if (!channel) {
    console.error('RabbitMQ channel not initialized!');
    return;
  }

  try {
    // Messages must be sent as Buffers (raw bytes)
    const messageBuffer = Buffer.from(JSON.stringify(orderData));
    
    channel.sendToQueue('ORDER_CREATED_QUEUE', messageBuffer);
    console.log(`[x] Sent order message to queue:`, orderData);
  } catch (error) {
    console.error('Failed to publish order message:', error);
  }
};

module.exports = { connectRabbitMQ, publishOrderMessage };
