// src/middleware/auth.js [Middleware to protect routes by verifying JWT tokens]
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret } = require('../config/env');

/**
 * protect
 * - Extracts JWT from the Authorization header
 * - Verifies the token
 * - Fetches the user from database and attaches to req.user
 * - Calls next() to move to the route handler
 * - If any check fails, responds with 401 (Unauthorized)
 */
const protect = async (req, res, next) => {
  try {
    // 1. Check if header exists and starts with 'Bearer '
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    // 2. Extract the token (remove 'Bearer ')
    const token = authHeader.split(' ')[1];

    // 3. Verify token using secret
    const decoded = jwt.verify(token, jwtSecret);

    // 4. Fetch user from DB (exclude password)
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user no longer exists' });
    }

    // 5. Attach user to request object for further use
    req.user = user;
    next(); // move to the protected route handler
  } catch (error) {
    // If token expired or invalid signature
    return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
};

module.exports = { protect };