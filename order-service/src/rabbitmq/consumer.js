const amqp = require('amqplib');
const Order = require('../models/order.model');
const axios = require('axios');

const startRabbitMQConsumer = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();

    const queue = 'INVENTORY_DEDUCTION_FAILED_QUEUE';
    await channel.assertQueue(queue);

    console.log(`RabbitMQ Consumer listening on ${queue}...`);

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        try {
          const data = JSON.parse(msg.content.toString());
          console.log(`\n[RabbitMQ] Received inventory deduction failure!`, data);

          const { orderId, chargeId } = data;

          // 1. Update Order Status
          await Order.update({ status: 'FAILED' }, { where: { id: orderId } });
          console.log(`[Order] Order ${orderId} marked as FAILED`);

          // 2. Refund Stripe Payment
          if (chargeId) {
            try {
              const paymentUrl = process.env.PAYMENT_SERVICE_URL || 'http://127.0.0.1:3004';
              await axios.post(`${paymentUrl}/api/payments/refund`, { chargeId });
              console.log(`[Order] Successfully triggered refund for charge ${chargeId}`);
            } catch (refundError) {
              console.error(`[Order] Failed to trigger refund for charge ${chargeId}:`, refundError.message);
            }
          }

          channel.ack(msg);
        } catch (error) {
          console.error('[RabbitMQ] Error processing message:', error);
          // Don't ack so it can be retried, or handle dead-lettering
        }
      }
    });

  } catch (error) {
    console.error('Failed to connect RabbitMQ Consumer in Order Service:', error);
  }
};

module.exports = { startRabbitMQConsumer };
