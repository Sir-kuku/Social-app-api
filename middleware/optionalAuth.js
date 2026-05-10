// middleware/optionalAuth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret } = require('../config/env');

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, jwtSecret);
      const user = await User.findById(decoded.id);
      if (user) req.user = user;
    }
  } catch (err) { /* ignore invalid tokens – stay anonymous */ }
  next();
};

module.exports = { optionalAuth };