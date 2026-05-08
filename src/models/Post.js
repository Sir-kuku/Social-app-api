// src/models/Post.js
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,  // stores a user ID
      ref: 'User',                           // tells Mongoose it refers to the User model
      required: true,
    },
    tags: {
      type: [String],   // array of strings, e.g. ["tech", "news"]
      default: [],
    },
    state: {
      type: String,
      enum: ['draft', 'published'],   // only these two values allowed
      default: 'draft',               // every new post starts as draft
    },
    like_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    comment_count: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,   // createdAt & updatedAt
  }
);

module.exports = mongoose.model('Post', postSchema);