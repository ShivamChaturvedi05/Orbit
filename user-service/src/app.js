const express = require('express');
const globalErrorHandler = require('./middlewares/error.middleware');
const userRoutes = require('./routes/user.routes');

const app = express();

app.use(express.json());

// Routes
app.use('/', userRoutes);

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
