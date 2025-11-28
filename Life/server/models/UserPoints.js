const mongoose = require('mongoose');

const userPointsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  level: {
    type: Number,
    default: 1,
    min: 1
  },
  badges: [{
    name: String,
    description: String,
    icon: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastDonation: Date,
  totalDonations: {
    type: Number,
    default: 0
  },
  streak: {
    count: {
      type: Number,
      default: 0
    },
    lastUpdated: Date
  },
  achievements: [{
    type: String,
    enum: ['FIRST_DONATION', 'REGULAR_DONOR', 'LIFESAVER', 'COMMUNITY_HERO', 'PLATINUM_DONOR']
  }]
}, {
  timestamps: true
});

// Add points to user
userPointsSchema.methods.addPoints = async function(points, reason) {
  this.points += points;
  await this.save();
  
  // Check for level up
  const newLevel = Math.floor(Math.cbrt(this.points / 100)) + 1;
  if (newLevel > this.level) {
    this.level = newLevel;
    await this.save();
    return { levelUp: true, newLevel };
  }
  
  return { levelUp: false };
};

// Record a donation
userPointsSchema.methods.recordDonation = async function() {
  const now = new Date();
  this.lastDonation = now;
  this.totalDonations += 1;
  
  // Update streak
  const lastDonation = this.streak.lastUpdated ? new Date(this.streak.lastUpdated) : null;
  const daysSinceLastDonation = lastDonation ? 
    Math.floor((now - lastDonation) / (1000 * 60 * 60 * 24)) : Infinity;
    
  if (daysSinceLastDonation === 1) {
    // Continue streak
    this.streak.count += 1;
  } else if (daysSinceLastDonation > 1) {
    // Reset streak
    this.streak.count = 1;
  }
  
  this.streak.lastUpdated = now;
  
  // Add points for donation (base + streak bonus)
  const basePoints = 100;
  const streakBonus = Math.min(this.streak.count * 5, 50); // Max 50% bonus
  const totalPoints = basePoints + Math.floor((basePoints * streakBonus) / 100);
  
  await this.addPoints(totalPoints, 'blood_donation');
  
  // Check for achievements
  await this.checkAchievements();
  
  return { points: totalPoints, streak: this.streak.count };
};

// Check and award achievements
userPointsSchema.methods.checkAchievements = async function() {
  const achievements = [];
  
  // First donation
  if (this.totalDonations === 1 && !this.achievements.includes('FIRST_DONATION')) {
    this.achievements.push('FIRST_DONATION');
    await this.addPoints(50, 'achievement_first_donation');
    achievements.push('FIRST_DONATION');
  }
  
  // Regular donor (5+ donations)
  if (this.totalDonations >= 5 && !this.achievements.includes('REGULAR_DONOR')) {
    this.achievements.push('REGULAR_DONOR');
    await this.addPoints(200, 'achievement_regular_donor');
    achievements.push('REGULAR_DONOR');
  }
  
  // Lifesaver (10+ donations)
  if (this.totalDonations >= 10 && !this.achievements.includes('LIFESAVER')) {
    this.achievements.push('LIFESAVER');
    await this.addPoints(500, 'achievement_lifesaver');
    achievements.push('LIFESAVER');
  }
  
  // Community hero (25+ donations)
  if (this.totalDonations >= 25 && !this.achievements.includes('COMMUNITY_HERO')) {
    this.achievements.push('COMMUNITY_HERO');
    await this.addPoints(1000, 'achievement_community_hero');
    achievements.push('COMMUNITY_HERO');
  }
  
  // Platinum donor (50+ donations)
  if (this.totalDonations >= 50 && !this.achievements.includes('PLATINUM_DONOR')) {
    this.achievements.push('PLATINUM_DONOR');
    await this.addPoints(2500, 'achievement_platinum_donor');
    achievements.push('PLATINUM_DONOR');
  }
  
  if (achievements.length > 0) {
    await this.save();
  }
  
  return achievements;
};

// Get leaderboard
userPointsSchema.statics.getLeaderboard = async function(limit = 10, skip = 0) {
  return this.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userData'
      }
    },
    { $unwind: '$userData' },
    {
      $project: {
        _id: 1,
        userId: '$user',
        name: '$userData.name',
        avatar: '$userData.avatar',
        points: 1,
        level: 1,
        totalDonations: 1,
        lastDonation: 1,
        streak: 1,
        achievements: { $size: '$achievements' }
      }
    },
    { $sort: { points: -1, level: -1, 'streak.count': -1 } },
    { $skip: skip },
    { $limit: limit }
  ]);
};

// Get user rank
userPointsSchema.statics.getUserRank = async function(userId) {
  const result = await this.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userData'
      }
    },
    { $unwind: '$userData' },
    {
      $project: {
        userId: '$user',
        points: 1,
        level: 1,
        totalDonations: 1
      }
    },
    {
      $setWindowFields: {
        sortBy: { points: -1, level: -1 },
        output: {
          rank: { $rank: {} }
        }
      }
    },
    { $match: { userId: mongoose.Types.ObjectId(userId) } }
  ]);
  
  return result.length > 0 ? result[0].rank : null;
};

const UserPoints = mongoose.model('UserPoints', userPointsSchema);

module.exports = UserPoints;
