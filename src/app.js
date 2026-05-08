// src/app.js [Main Express application setup, middleware, and basic routes]
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Create the Express application
const app = express();

// Middleware – functions that run on every request
app.use(cors());                // Allow cross-origin requests
app.use(express.json());        // Automatically parse JSON bodies
app.use(morgan('dev'));         // Log requests to console

// A simple health-check endpoint
app.get('/', (req, res) => {
  res.send('Social App API is running...');
});

// Routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes); // Mount auth routes at /auth

const postRoutes = require('./routes/posts');
app.use('/posts', postRoutes);

const meRoutes = require('./routes/me');
app.use('/me', meRoutes);

const feedRoutes = require('./routes/feed');
app.use('/feed', feedRoutes);

// 404 handler – if no route matches
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler (catches errors from routes)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = app; // exported so we can test it with supertest