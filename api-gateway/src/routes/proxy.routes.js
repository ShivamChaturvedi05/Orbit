const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const authenticateToken = require('../middlewares/auth.middleware');

const router = express.Router();

router.use('/api/users', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: { '^/api/users': '' },
}));

router.use('/api/inventory/public', createProxyMiddleware({
  target: 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: { '^/': '/api/inventory/' },
}));

router.use('/api/inventory/secure', authenticateToken, createProxyMiddleware({
  target: 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: { '^/': '/api/inventory/' },
}));

router.use('/api/orders', authenticateToken, createProxyMiddleware({
  target: 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: { '^/': '/api/orders/' }
}));

router.use('/api/payments', authenticateToken, createProxyMiddleware({
  target: 'http://localhost:3004',
  changeOrigin: true,
  pathRewrite: { '^/': '/api/payments/' }
}));

module.exports = router;
