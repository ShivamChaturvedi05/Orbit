require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

// --- 1. Security Middlewares ---
app.use(helmet());

app.use(cors({ origin: 'http://localhost:5173' }));

// Rate Limiting: Max 100 requests per 15 minutes per IP address
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use(limiter);

// --- 2. Authentication Middleware (The Bouncer) ---
// This intercepts requests, checks the JWT token, and blocks them if they are fake.
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Access Denied: No Token Provided!' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Access Denied: Invalid Token!' });
    }

    // The token is valid! Let's attach the user's ID to the headers so the underlying microservices know who made the request.
    req.headers['x-user-id'] = user.userId;
    next();
  });
};

// --- 3. Routing (The Proxy) ---

// Route 1: User Service (Auth is NOT required to login/register)
app.use('/api/users', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: { '^/api/users': '' },
}));

// Route 2: Inventory Service (Example: Public can view products without logging in)
app.use('/api/inventory/public', createProxyMiddleware({
  target: 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: { '^/api/inventory/public': '' },
}));

// Route 3: Secure Inventory Actions (Example: Adding products requires authentication)
app.use('/api/inventory/secure', authenticateToken, createProxyMiddleware({
  target: 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: { '^/api/inventory/secure': '' },
}));

// Global Error Catch for the Gateway
app.use((err, req, res, next) => {
  console.error('[Gateway Error]', err.message);
  res.status(500).json({ error: 'Gateway Error: Service Unavailable' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Gateway is running securely on port ${PORT}`);
});
