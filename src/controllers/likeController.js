// src/controllers/likeController.js
const Like = require('../models/Like');
const Post = require('../models/Post');

/**
 * likePost
 * - Auth required
 * - Likes a post (cannot like same post twice)
 * - Increments the post's like_count
 */
const likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    // ----- 1. Check if post exists -----
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // ----- 2. Attempt to insert the like (will fail if duplicate) -----
    // Using create() so if it's a duplicate, the unique index throws an error
    try {
      await Like.create({ user: userId, post: postId });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ message: 'You have already liked this post' });
      }
      throw err; // rethrow for global error handler
    }

    // ----- 3. Increment like_count on the post -----
    post.like_count += 1;
    await post.save();

    res.status(201).json({ message: 'Post liked', like_count: post.like_count });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error while liking post' });
  }
};

/**
 * unlikePost
 * - Auth required
 * - Unlikes a post (removes the like document)
 * - Decrements the post's like_count
 */
const unlikePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    // ----- 1. Check if post exists -----
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // ----- 2. Remove the like document -----
    const like = await Like.findOneAndDelete({ user: userId, post: postId });
    if (!like) {
      return res.status(404).json({ message: 'You have not liked this post' });
    }

    // ----- 3. Decrement like_count (but never go below 0) -----
    post.like_count = Math.max(0, post.like_count - 1);
    await post.save();

    res.status(200).json({ message: 'Post unliked', like_count: post.like_count });
  } catch (error) {
    console.error('Unlike post error:', error);
    res.status(500).json({ message: 'Server error while unliking post' });
  }
};

module.exports = { likePost, unlikePost };