// src/controllers/followController.js
const Follow = require('../models/Follow');
const User = require('../models/User');

/**
 * followUser
 * - Auth required
 * - Follow another user (cannot follow self, cannot duplicate)
 */
const followUser = async (req, res) => {
  try {
    const userToFollowId = req.params.userId;
    const currentUserId = req.user._id.toString();

    // ----- 1. Prevent self-follow -----
    if (userToFollowId === currentUserId) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    // ----- 2. Check if target user exists -----
    const targetUser = await User.findById(userToFollowId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User to follow not found' });
    }

    // ----- 3. Check for duplicate follow -----
    const existingFollow = await Follow.findOne({
      follower: currentUserId,
      following: userToFollowId,
    });
    if (existingFollow) {
      return res.status(409).json({ message: 'You are already following this user' });
    }

    // ----- 4. Create the follow document -----
    await Follow.create({
      follower: currentUserId,
      following: userToFollowId,
    });

    res.status(201).json({ message: 'Successfully followed user' });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ message: 'Server error while following user' });
  }
};

/**
 * unfollowUser
 * - Auth required
 * - Unfollow a user you previously followed
 */
const unfollowUser = async (req, res) => {
  try {
    const userToUnfollowId = req.params.userId;
    const currentUserId = req.user._id.toString();

    const followDoc = await Follow.findOneAndDelete({
      follower: currentUserId,
      following: userToUnfollowId,
    });

    if (!followDoc) {
      return res.status(404).json({ message: 'You are not following this user' });
    }

    res.status(200).json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ message: 'Server error while unfollowing user' });
  }
};

/**
 * getFollowing
 * - Auth required
 * - Returns list of users I follow
 */
const getFollowing = async (req, res) => {
  try {
    const follows = await Follow.find({ follower: req.user._id })
      .populate('following', 'first_name last_name username email');

    // Extract only the 'following' user objects
    const usersIFollow = follows.map((f) => f.following);

    res.status(200).json({ count: usersIFollow.length, following: usersIFollow });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ message: 'Server error while fetching following list' });
  }
};

/**
 * getFollowers
 * - Auth required
 * - Returns list of users following me
 */
const getFollowers = async (req, res) => {
  try {
    const follows = await Follow.find({ following: req.user._id })
      .populate('follower', 'first_name last_name username email');

    const myFollowers = follows.map((f) => f.follower);

    res.status(200).json({ count: myFollowers.length, followers: myFollowers });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ message: 'Server error while fetching followers list' });
  }
};

module.exports = { followUser, unfollowUser, getFollowing, getFollowers };