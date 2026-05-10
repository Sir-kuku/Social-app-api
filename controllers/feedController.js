// controllers/feedController.js
const Post = require('../models/Post');
const Follow = require('../models/Follow');
const Like = require('../models/Like');   // <-- newly required

/**
 * getFeed
 * - Auth required
 * - Returns published posts from the current user + followed users
 * - Includes a likedByMe boolean so the frontend can show filled / outline hearts
 * - Sorted by newest first
 * - Paginated (default 20 per page)
 */
const getFeed = async (req, res) => {
  try {
    // ----- 1. PAGINATION -----
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // ----- 2. BUILD LIST OF AUTHOR IDs -----
    const currentUserId = req.user._id;

    const followDocs = await Follow.find({ follower: currentUserId }).select('following');
    const followedUserIds = followDocs.map(doc => doc.following);
    const authorIds = [currentUserId, ...followedUserIds];

    // ----- 3. QUERY POSTS -----
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

    // ----- 4. ADD likedByMe FLAG -----
    const postIds = posts.map(p => p._id);
    const likes = await Like.find({
      user: currentUserId,
      post: { $in: postIds }
    });
    const likedPostIds = new Set(likes.map(l => l.post.toString()));

    const postsWithLikeStatus = posts.map(post => ({
      ...post.toObject(),
      likedByMe: likedPostIds.has(post._id.toString())
    }));

    // ----- 5. RESPONSE -----
    res.status(200).json({
      page,
      limit,
      totalPosts,
      totalPages,
      posts: postsWithLikeStatus,
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ message: 'Server error while fetching feed' });
  }
};

module.exports = { getFeed };