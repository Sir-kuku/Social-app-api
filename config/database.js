// src/config/database.js [Connection Logic for MongoDB using Mongoose]
const mongoose = require('mongoose');

/**
 * connectDB
 * - Reads the MongoDB URI from our env config
 * - Connects to the database
 * - Logs success or exits the process on failure
 */
const connectDB = async () => {
  try {
    // Import the environment variables (we already have env.js)
    const { mongoUri } = require('./env');

    // Mongoose connects to MongoDB using the URI
    // No need for useNewUrlParser, useUnifiedTopology in Mongoose 6+ (they're default)
    const conn = await mongoose.connect(mongoUri);

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    // Exit the process with failure code (1) so the app doesn't run without a DB
    process.exit(1);
  }
};

module.exports = connectDB;