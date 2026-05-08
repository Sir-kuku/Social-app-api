// src/models/User.js [Defines the User model using Mongoose]
const mongoose = require('mongoose');

// Define the shape of a User document
const userSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: [true, 'First name is required'], // validation: must be provided
      trim: true, // removes whitespace from both ends
    },
    last_name: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true, // no two users can have the same username
      trim: true,
      lowercase: true, // store usernames in lowercase to avoid case-sensitivity issues
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      // Simple email format validation using regex
      match: [/.+@.+\..+/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      // Later we will hash the password – we'll never store raw passwords
      // select: false ensures password is excluded by default when querying users
      select: false,
    },
  },
  {
    // Automatically add createdAt and updatedAt fields
    timestamps: true,
  }
);

// Create and export the model
const User = mongoose.model('User', userSchema);

module.exports = User;