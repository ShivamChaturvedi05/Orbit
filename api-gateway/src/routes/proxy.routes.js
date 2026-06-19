const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const authenticateToken = require('../middlewares/auth.middleware');

const router = express.Router();

router.use('/api/users', createProxyMiddleware({
  target: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: { '^/api/users': '' },
}));

router.use('/api/inventory/public', createProxyMiddleware({
  target: process.env.INVENTORY_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: { '^/': '/api/inventory/' },
}));

router.use('/api/inventory/secure', authenticateToken, createProxyMiddleware({
  target: process.env.INVENTORY_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: { '^/': '/api/inventory/' },
}));

router.use('/api/orders', authenticateToken, createProxyMiddleware({
  target: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  // No pathRewrite needed because Order Service is listening on root /
}));

router.use('/api/payments', authenticateToken, createProxyMiddleware({
  target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
  changeOrigin: true,
  pathRewrite: { '^/': '/api/payments/' }
}));

module.exports = router;
