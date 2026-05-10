// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/token');

/**
 * signup
 * - Receives user details from request body
 * - Checks if email or username already exist
 * - Hashes the password
 * - Creates the user in database
 * - Returns user info (without password) and a JWT token
 */
const signup = async (req, res) => {
  try {
    const { first_name, last_name, username, email, password } = req.body;

    // ----- Validation: check for missing fields -----
    if (!first_name || !last_name || !username || !email || !password) {
      return res.status(400).json({
        message: 'All fields are required: first_name, last_name, username, email, password',
      });
    }

    // ----- Check if email or username already taken -----
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });
    if (existingUser) {
      return res.status(409).json({
        message: 'User with that email or username already exists',
      });
    }

    // ----- Hash the password -----
    // salt = random string added to the password before hashing
    // 12 rounds is a good balance between security and speed
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ----- Create user -----
    const user = await User.create({
      first_name,
      last_name,
      username,
      email,
      password: hashedPassword,
    });

    // ----- Generate token for the new user -----
    const token = generateToken(user._id);

    // ----- Respond with user data (exclude password) and token -----
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    // If a validation error from Mongoose (like duplicate key), return 400
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Duplicate field value. Email or username already exists.' });
    }
    res.status(500).json({ message: 'Server error during signup' });
  }
};

/**
 * signin
 * - Receives email/username and password
 * - Finds user by email or username
 * - Compares password
 * - If valid, returns user info + JWT token
 */
const signin = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Must provide either email or username to identify the user
    if ((!email && !username) || !password) {
      return res.status(400).json({
        message: 'Please provide email (or username) and password',
      });
    }

    // ----- Find user by email or username -----
    // Explicitly select password field (since we set select: false)
    const user = await User.findOne(
      email ? { email: email.toLowerCase() } : { username: username.toLowerCase() }
    ).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // ----- Compare password -----
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // ----- Generate token -----
    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Server error during signin' });
  }
};

module.exports = { signup, signin };