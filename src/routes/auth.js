// src/routes/auth.js
const express = require('express');
const router = express.Router();
const { signup, signin } = require('../controllers/authController');

// POST /auth/signup
router.post('/signup', signup);

// POST /auth/signin
router.post('/signin', signin);

module.exports = router;