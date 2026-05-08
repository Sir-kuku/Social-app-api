// src/routes/me.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMyPosts } = require('../controllers/postController');
const { followUser, unfollowUser, getFollowing, getFollowers } = require('../controllers/followController');

// Post routes
router.get('/posts', protect, getMyPosts);

// Follow routes
router.post('/follow/:userId', protect, followUser);       // Follow a user
router.delete('/follow/:userId', protect, unfollowUser);   // Unfollow a user
router.get('/following', protect, getFollowing);           // Who I follow
router.get('/followers', protect, getFollowers);           // Who follows me

module.exports = router;