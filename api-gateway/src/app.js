const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimiter = require('./middlewares/rateLimit.middleware');
const proxyRoutes = require('./routes/proxy.routes');

const app = express();

// Trust the first proxy to enable correct IP tracking for rate limiting behind a Load Balancer
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(rateLimiter);

app.use('/', proxyRoutes);

app.use((err, req, res, next) => {
  console.error('[Gateway Error]', err.message);
  res.status(500).json({ error: 'Gateway Error: Service Unavailable' });
});

module.exports = app;
