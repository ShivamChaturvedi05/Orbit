const amqp = require('amqplib');
require('dotenv').config();

let channel = null;

const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    
    await channel.assertQueue('INVENTORY_DEDUCTION_FAILED_QUEUE');
    console.log('RabbitMQ Producer Connected for Inventory Service...');
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    process.exit(1);
  }
};

const publishFailedDeductionEvent = async (failedData) => {
  if (!channel) {
    console.error('RabbitMQ channel not initialized!');
    return;
  }

  try {
    const messageBuffer = Buffer.from(JSON.stringify(failedData));
    channel.sendToQueue('INVENTORY_DEDUCTION_FAILED_QUEUE', messageBuffer);
    console.log(`[x] Sent failed deduction event to queue:`, failedData);
  } catch (error) {
    console.error('Failed to publish failed deduction event:', error);
  }
};

module.exports = { connectRabbitMQ, publishFailedDeductionEvent };
