const { Worker } = require('bullmq');
const axios = require('axios');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { connection } = require('../db/redis');

// Initialize the Worker
const transferWorker = new Worker('transferQueue', async (job) => {
  const { sellerId, price, quantity, chargeId, transferGroup, currency } = job.data;

  console.log(`[BullMQ Worker] Processing transfer for seller ${sellerId} from charge ${chargeId}`);

  const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
  
  // 1. Fetch the seller's Stripe Account ID from User Service
  const userRes = await axios.get(`${userServiceUrl}/${sellerId}/stripe-account`);
  const stripeAccountId = userRes.data.stripeAccountId;

  if (!stripeAccountId) {
    console.log(`[BullMQ Worker] Seller ${sellerId} has no Stripe account. Skipping transfer.`);
    return;
  }

  // 2. Calculate 90% seller cut
  const sellerCut = Math.round(price * quantity * 0.9 * 100);

  // 3. Execute Stripe Transfer
  await stripe.transfers.create({
    amount: sellerCut,
    currency: currency,
    destination: stripeAccountId,
    transfer_group: transferGroup,
    source_transaction: chargeId
  });

  console.log(`[BullMQ Worker] SUCCESS - Transferred $${(sellerCut / 100).toFixed(2)} to ${stripeAccountId}`);

}, { connection });

transferWorker.on('completed', (job) => {
  console.log(`[BullMQ Worker] Job ${job.id} completed!`);
});

transferWorker.on('failed', (job, err) => {
  console.error(`[BullMQ Worker] Job ${job.id} failed: ${err.message}. Retrying...`);
});

module.exports = { transferWorker };
