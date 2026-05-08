// src/utils/token.js [Utility function to generate JWT tokens for authentication]
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

/**
 * generateToken
 * - Takes a user ID as payload
 * - Signs it with the secret
 * - Sets token to expire in 1 hour
 * - Returns the token string
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, jwtSecret, {
    expiresIn: '1h',        // 1 hour expiry as required
  });
};

module.exports = { generateToken };