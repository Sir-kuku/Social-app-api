// controllers/postController.js
const Post = require('../models/Post');
const User = require('../models/User');   // needed for author search
const Like = require('../models/Like');   // needed for likedByMe flag

/**
 * createPost
 * - Auth required
 * - Creates a post with state 'draft'
 * - Attaches the logged-in user as author
 */
const createPost = async (req, res) => {
  try {
    const { title, content, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const post = await Post.create({
      title,
      content,
      tags,
      author: req.user._id,
    });

    res.status(201).json({ message: 'Post created (draft)', post });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error while creating post' });
  }
};

/**
 * getAllPublished (enhanced)
 * - No auth required
 * - Paginated (default 20 per page)
 * - Searchable by author, title, tags
 * - Sortable by like_count, comment_count, timestamp
 */
const getAllPublished = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { state: 'published' };

    if (req.query.author) {
      const authors = await User.find({
        $or: [
          { first_name: { $regex: req.query.author, $options: 'i' } },
          { last_name: { $regex: req.query.author, $options: 'i' } },
        ],
      }).select('_id');

      if (authors.length > 0) {
        filter.author = { $in: authors.map(u => u._id) };
      } else {
        return res.status(200).json({ page, limit, totalPosts: 0, totalPages: 0, posts: [] });
      }
    }

    if (req.query.title) {
      filter.title = { $regex: req.query.title, $options: 'i' };
    }

    if (req.query.tags) {
      const tagsArray = req.query.tags.split(',').map(t => t.trim());
      filter.tags = { $in: tagsArray };
    }

    let sortOption = {};
    if (req.query.sort) {
      const sortField = req.query.sort;
      const allowedSorts = ['like_count', 'comment_count', 'timestamp'];
      if (allowedSorts.includes(sortField)) {
        const field = sortField === 'timestamp' ? 'createdAt' : sortField;
        const order = req.query.order === 'asc' ? 1 : -1;
        sortOption[field] = order;
      }
    } else {
      sortOption = { createdAt: -1 };
    }

    const totalPosts = await Post.countDocuments(filter);
    const totalPages = Math.ceil(totalPosts / limit);

    const posts = await Post.find(filter)
      .populate('author', 'first_name last_name username email')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    // Add likedByMe if the user is authenticated
    let postsWithLikeStatus = posts;
    if (req.user) {
      const postIds = posts.map(p => p._id);
      const likes = await Like.find({ user: req.user._id, post: { $in: postIds } });
      const likedPostIds = new Set(likes.map(l => l.post.toString()));

      postsWithLikeStatus = posts.map(post => ({
        ...post.toObject(),
        likedByMe: likedPostIds.has(post._id.toString()),
      }));
    }

    res.status(200).json({
      page,
      limit,
      totalPosts,
      totalPages,
      posts: postsWithLikeStatus,
    });
  } catch (error) {
    console.error('Get published posts error:', error);
    res.status(500).json({ message: 'Server error while fetching posts' });
  }
};

/**
 * getPostById
 * - No auth required
 * - Returns a single published post with author info
 */
const getPostById = async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, state: 'published' })
      .populate('author', 'first_name last_name username email');

    if (!post) {
      return res.status(404).json({ message: 'Post not found or not published' });
    }

    res.status(200).json({ post });
  } catch (error) {
    console.error('Get post by ID error:', error);
    res.status(500).json({ message: 'Server error while fetching post' });
  }
};

/**
 * getMyPosts
 * - Auth required
 * - Returns only posts belonging to the logged-in user
 * - Paginated (default 20 per page)
 * - Filterable by state (draft | published)
 * - Includes likedByMe flag for the owner
 */
const getMyPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { author: req.user._id };

    if (req.query.state) {
      const state = req.query.state;
      if (['draft', 'published'].includes(state)) {
        filter.state = state;
      } else {
        return res.status(400).json({ message: 'Invalid state filter. Use "draft" or "published".' });
      }
    }

    const totalPosts = await Post.countDocuments(filter);
    const totalPages = Math.ceil(totalPosts / limit);

    const posts = await Post.find(filter)
      .populate('author', 'first_name last_name username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Add likedByMe flag
    const postIds = posts.map(p => p._id);
    const likes = await Like.find({
      user: req.user._id,
      post: { $in: postIds }
    });
    const likedPostIds = new Set(likes.map(l => l.post.toString()));

    const postsWithLikeStatus = posts.map(post => ({
      ...post.toObject(),
      likedByMe: likedPostIds.has(post._id.toString())
    }));

    res.status(200).json({
      page,
      limit,
      totalPosts,
      totalPages,
      posts: postsWithLikeStatus,
    });
  } catch (error) {
    console.error('Get my posts error:', error);
    res.status(500).json({ message: 'Server error while fetching your posts' });
  }
};

/**
 * updatePost
 * - Auth required
 * - Only the author can update title, content, tags
 */
const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not the owner of this post' });
    }

    const { title, content, tags } = req.body;
    if (title) post.title = title;
    if (content) post.content = content;
    if (tags) post.tags = tags;

    await post.save();

    res.status(200).json({ message: 'Post updated', post });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error while updating post' });
  }
};

/**
 * deletePost
 * - Auth required
 * - Only the author can delete
 */
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not the owner of this post' });
    }

    await post.deleteOne();

    res.status(200).json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error while deleting post' });
  }
};

/**
 * publishPost
 * - Auth required
 * - Only the author can change state from draft to published
 */
const publishPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not the owner of this post' });
    }

    if (post.state === 'published') {
      return res.status(400).json({ message: 'Post is already published' });
    }

    post.state = 'published';
    await post.save();

    res.status(200).json({ message: 'Post published', post });
  } catch (error) {
    console.error('Publish post error:', error);
    res.status(500).json({ message: 'Server error while publishing post' });
  }
};

module.exports = {
  createPost,
  getAllPublished,
  getPostById,
  getMyPosts,
  updatePost,
  deletePost,
  publishPost,
};