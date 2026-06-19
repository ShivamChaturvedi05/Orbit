const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimiter = require('./middlewares/rateLimit.middleware');
const proxyRoutes = require('./routes/proxy.routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(rateLimiter);

app.use('/', proxyRoutes);

app.use((err, req, res, next) => {
  console.error('[Gateway Error]', err.message);
  res.status(500).json({ error: 'Gateway Error: Service Unavailable' });
});

module.exports = app;
