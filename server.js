// src/server.js [Entry point of the application, connects to DB and starts the server]
const app = require('./app');
const { port, nodeEnv } = require('./config/env');
const connectDB = require('./config/database'); // to call the database connection

// Connect to the database, then start the server
if (nodeEnv !== 'test') {
  connectDB().then(() => {
    app.listen(port, () => {
      console.log(`Server running in ${nodeEnv} mode on port ${port}`);
    });
  }).catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
