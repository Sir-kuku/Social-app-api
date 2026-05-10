// src/config/env.js
// This file makes sure we don't forget to set critical variables
const dotenv = require('dotenv');
dotenv.config(); // reads the .env file

// Export an object so other files can use these values
module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
};