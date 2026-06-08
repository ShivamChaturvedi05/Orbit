const express = require('express');
const productRoutes = require('./routes/product.routes');

const app = express();
app.use(express.json());

app.use('/api/inventory', productRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Inventory Service Error]', err);
  res.status(500).json({ error: 'An unexpected internal error occurred in the inventory service.' });
});

module.exports = app;
