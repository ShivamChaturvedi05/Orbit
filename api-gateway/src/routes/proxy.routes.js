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
  pathRewrite: { '^/api/inventory/public': '' },
}));

router.use('/api/inventory/secure', authenticateToken, createProxyMiddleware({
  target: 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: { '^/api/inventory/secure': '' },
}));

module.exports = router;
