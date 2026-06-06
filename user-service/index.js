require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi'); // Import validation library
const { connectDB, User } = require('./database');

const app = express();
app.use(express.json());

// --- 1. Validation Schemas ---
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(30).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// --- 2. Registration Endpoint ---
app.post('/register', async (req, res, next) => {
  try {
    // Validate Input BEFORE trusting it
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash the password securely
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create the user in PostgreSQL
    const newUser = await User.create({
      email,
      password: hashedPassword
    });

    res.status(201).json({ message: 'User created successfully', userId: newUser.id });
  } catch (error) {
    // Pass unexpected errors to the Global Error Handler
    next(error);
  }
});

// --- 3. Login Endpoint ---
app.post('/login', async (req, res, next) => {
  try {
    // Validate Input
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = req.body;

    // Find the user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login successful', token });
  } catch (error) {
    // Pass unexpected errors to the Global Error Handler
    next(error);
  }
});

// --- 4. Global Error Handler---
app.use((err, req, res, next) => {
  // 1. Log the detailed error to your private backend console
  console.error('[Global Error Logger]', err);

  // 2. Send a generic, safe response to the hacker/user so they learn nothing about your database
  res.status(500).json({
    error: 'An unexpected internal server error occurred.'
  });
});

const PORT = process.env.PORT || 3001;

// Start server after connecting to DB
app.listen(PORT, async () => {
  await connectDB();
  console.log(`User Service running securely on port ${PORT}`);
});
