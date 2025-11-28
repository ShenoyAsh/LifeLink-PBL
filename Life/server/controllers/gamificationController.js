const UserPoints = require('../models/UserPoints');
const User = require('../models/User');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get leaderboard
// @route   GET /api/gamification/leaderboard
// @access  Public
exports.getLeaderboard = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const [leaderboard, total] = await Promise.all([
    UserPoints.getLeaderboard(limit, skip),
    UserPoints.countDocuments()
  ]);

  // Get current user's rank if authenticated
  let userRank = null;
  let userStats = null;
  
  if (req.user) {
    userRank = await UserPoints.getUserRank(req.user.id);
    userStats = await UserPoints.findOne({ user: req.user.id });
  }

  res.status(200).json({
    success: true,
    count: leaderboard.length,
    data: leaderboard,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total
    },
    userStats: userStats ? {
      rank: userRank,
      points: userStats.points,
      level: userStats.level,
      totalDonations: userStats.totalDonations,
      streak: userStats.streak.count,
      achievements: userStats.achievements.length
    } : null
  });
});

// @desc    Get user's gamification stats
// @route   GET /api/gamification/me
// @access  Private
exports.getMyStats = asyncHandler(async (req, res, next) => {
  let userPoints = await UserPoints.findOne({ user: req.user.id });
  
  // If user doesn't have points record yet, create one
  if (!userPoints) {
    userPoints = await UserPoints.create({ user: req.user.id });
  }
  
  const rank = await UserPoints.getUserRank(req.user.id);
  
  // Calculate progress to next level
  const currentLevel = userPoints.level;
  const pointsForCurrentLevel = Math.pow((currentLevel - 1) * 10, 3);
  const pointsForNextLevel = Math.pow(currentLevel * 10, 3);
  const progress = Math.min(
    100,
    Math.floor(
      ((userPoints.points - pointsForCurrentLevel) / 
      (pointsForNextLevel - pointsForCurrentLevel)) * 100
    )
  );
  
  // Get recent activity
  const recentActivity = [];
  
  // Add donation history (you'll need to implement this based on your donation model)
  // Example:
  // const donations = await Donation.find({ donor: req.user.id })
  //   .sort('-donationDate')
  //   .limit(5);
  // 
  // donations.forEach(donation => {
  //   recentActivity.push({
  //     type: 'DONATION',
  //     points: 100, // Base points for donation
  //     description: 'Blood donation',
  //     date: donation.donationDate
  //   });
  // });
  
  // Add achievement unlocks
  if (userPoints.achievements.length > 0) {
    userPoints.achievements.forEach(achievement => {
      recentActivity.push({
        type: 'ACHIEVEMENT',
        points: getAchievementPoints(achievement),
        description: getAchievementName(achievement),
        icon: getAchievementIcon(achievement)
      });
    });
  }
  
  // Sort by date (most recent first)
  recentActivity.sort((a, b) => b.date - a.date);
  
  res.status(200).json({
    success: true,
    data: {
      points: userPoints.points,
      level: userPoints.level,
      rank,
      progressToNextLevel: progress,
      totalDonations: userPoints.totalDonations,
      streak: userPoints.streak.count,
      lastDonation: userPoints.lastDonation,
      achievements: userPoints.achievements.map(achievement => ({
        name: achievement,
        title: getAchievementName(achievement),
        description: getAchievementDescription(achievement),
        icon: getAchievementIcon(achievement),
        points: getAchievementPoints(achievement)
      })),
      recentActivity: recentActivity.slice(0, 10) // Limit to 10 most recent
    }
  });
});

// @desc    Record a donation (called when a donation is completed)
// @route   POST /api/gamification/record-donation
// @access  Private
exports.recordDonation = asyncHandler(async (req, res, next) => {
  // In a real app, you would verify the donation with your donation model
  // const donation = await Donation.findById(req.body.donationId);
  // if (!donation || donation.donor.toString() !== req.user.id) {
  //   return next(new ErrorResponse('Donation not found', 404));
  // }
  
  let userPoints = await UserPoints.findOne({ user: req.user.id });
  
  // If user doesn't have points record yet, create one
  if (!userPoints) {
    userPoints = await UserPoints.create({ user: req.user.id });
  }
  
  // Record the donation and get points
  const result = await userPoints.recordDonation();
  
  // Get updated user stats
  const rank = await UserPoints.getUserRank(req.user.id);
  
  res.status(200).json({
    success: true,
    data: {
      points: userPoints.points,
      pointsEarned: result.points,
      level: userPoints.level,
      rank,
      streak: userPoints.streak.count,
      totalDonations: userPoints.totalDonations
    }
  });
});

// @desc    Add points to user (for admin or system events)
// @route   POST /api/gamification/add-points
// @access  Private/Admin
exports.addPoints = asyncHandler(async (req, res, next) => {
  const { userId, points, reason } = req.body;
  
  // In a real app, you would verify admin privileges here
  // if (req.user.role !== 'admin') {
  //   return next(new ErrorResponse('Not authorized to add points', 403));
  // }
  
  let userPoints = await UserPoints.findOne({ user: userId });
  
  if (!userPoints) {
    userPoints = await UserPoints.create({ user: userId });
  }
  
  const result = await userPoints.addPoints(points, reason);
  
  res.status(200).json({
    success: true,
    data: {
      userId,
      points: userPoints.points,
      level: userPoints.level,
      levelUp: result.levelUp,
      newLevel: result.newLevel
    }
  });
});

// Helper functions for achievements
function getAchievementName(achievement) {
  const names = {
    FIRST_DONATION: 'First Blood',
    REGULAR_DONOR: 'Regular Donor',
    LIFESAVER: 'Lifesaver',
    COMMUNITY_HERO: 'Community Hero',
    PLATINUM_DONOR: 'Platinum Donor'
  };
  return names[achievement] || achievement;
}

function getAchievementDescription(achievement) {
  const descriptions = {
    FIRST_DONATION: 'Completed your first blood donation',
    REGULAR_DONOR: 'Donated blood 5 times',
    LIFESAVER: 'Donated blood 10 times',
    COMMUNITY_HERO: 'Donated blood 25 times',
    PLATINUM_DONOR: 'Donated blood 50 times'
  };
  return descriptions[achievement] || '';
}

function getAchievementIcon(achievement) {
  const icons = {
    FIRST_DONATION: '🩸',
    REGULAR_DONOR: '🏆',
    LIFESAVER: '💉',
    COMMUNITY_HERO: '🦸',
    PLATINUM_DONOR: '💎'
  };
  return icons[achievement] || '🏅';
}

function getAchievementPoints(achievement) {
  const points = {
    FIRST_DONATION: 50,
    REGULAR_DONOR: 200,
    LIFESAVER: 500,
    COMMUNITY_HERO: 1000,
    PLATINUM_DONOR: 2500
  };
  return points[achievement] || 0;
}
