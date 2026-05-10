// src/routes/posts.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createPost,
  getAllPublished,
  getPostById,
  updatePost,
  deletePost,
  publishPost,
} = require('../controllers/postController');
const { likePost, unlikePost } = require('../controllers/likeController');

// Public routes
router.get('/', getAllPublished);            // GET /posts
router.get('/:id', getPostById);             // GET /posts/:id

// Protected routes (auth required)
router.post('/', protect, createPost);       // POST /posts
router.patch('/:id', protect, updatePost);   // PATCH /posts/:id
router.delete('/:id', protect, deletePost);  // DELETE /posts/:id
router.put('/:id/publish', protect, publishPost); // PUT /posts/:id/publish

// Like / Unlike routes (on specific posts)
router.post('/:id/like', protect, likePost);       // POST /posts/:id/like
router.delete('/:id/like', protect, unlikePost);   // DELETE /posts/:id/like


module.exports = router;