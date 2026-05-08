// src/routes/feed.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getFeed } = require('../controllers/feedController');

// GET /feed – authenticated
router.get('/', protect, getFeed);

module.exports = router;