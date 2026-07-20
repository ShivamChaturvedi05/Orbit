const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const authenticateToken = require('../middlewares/auth.middleware');

const router = express.Router();

router.use('/api/users', createProxyMiddleware({
  target: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: { '^/api/users': '' },
  on: { error: (err, req, res) => { console.error('Proxy Error:', err); res.status(502).json({ error: 'User Service Unavailable' }); } }
}));

router.use('/api/inventory/public', createProxyMiddleware({
  target: process.env.INVENTORY_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: { '^/': '/api/inventory/' },
  on: { error: (err, req, res) => { console.error('Proxy Error:', err); res.status(502).json({ error: 'Inventory Service Unavailable' }); } }
}));

router.use('/api/inventory/secure', authenticateToken, createProxyMiddleware({
  target: process.env.INVENTORY_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: { '^/': '/api/inventory/' },
  on: { error: (err, req, res) => { console.error('Proxy Error:', err); res.status(502).json({ error: 'Inventory Service Unavailable' }); } }
}));

router.use('/api/orders', authenticateToken, createProxyMiddleware({
  target: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  on: { error: (err, req, res) => { console.error('Proxy Error:', err); res.status(502).json({ error: 'Order Service Unavailable' }); } }
}));

router.use('/api/payments', authenticateToken, createProxyMiddleware({
  target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
  changeOrigin: true,
  pathRewrite: { '^/': '/api/payments/' },
  on: { error: (err, req, res) => { console.error('Proxy Error:', err); res.status(502).json({ error: 'Payment Service Unavailable' }); } }
}));

module.exports = router;
