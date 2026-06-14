require('dotenv').config();
const express = require('express');
const paymentRoutes = require('./routes/payment.routes');

const app = express();
app.use(express.json());

// Mount the payment routes
app.use('/api/payments', paymentRoutes);

const PORT = process.env.PORT || 3004;

app.listen(PORT, () => {
  console.log(`Payment Service running on port ${PORT}`);
});
