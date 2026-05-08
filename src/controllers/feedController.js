// src/controllers/feedController.js
const Post = require('../models/Post');
const Follow = require('../models/Follow');

/**
 * getFeed
 * - Auth required
 * - Returns published posts from the current user + followed users
 * - Sorted by newest first (descending createdAt)
 * - Paginated (default 20 per page)
 */
const getFeed = async (req, res) => {
  try {
    // ---- 1. PAGINATION ----
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // ---- 2. BUILD LIST OF AUTHOR IDs ----
    const currentUserId = req.user._id;

    // Find all users the current user follows
    const followDocs = await Follow.find({ follower: currentUserId }).select('following');
    const followedUserIds = followDocs.map((doc) => doc.following);

    // Combine with own ID (so feed includes the user's own posts)
    const authorIds = [currentUserId, ...followedUserIds];

    // ---- 3. QUERY POSTS ----
    const filter = {
      state: 'published',
      author: { $in: authorIds },
    };

    const totalPosts = await Post.countDocuments(filter);
    const totalPages = Math.ceil(totalPosts / limit);

    const posts = await Post.find(filter)
      .populate('author', 'first_name last_name username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // ---- 4. RESPONSE ----
    res.status(200).json({
      page,
      limit,
      totalPosts,
      totalPages,
      posts,
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ message: 'Server error while fetching feed' });
  }
};

module.exports = { getFeed };