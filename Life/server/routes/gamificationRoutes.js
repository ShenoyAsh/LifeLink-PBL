const express = require('express');
const router = express.Router();
const {
  getLeaderboard,
  getMyStats,
  recordDonation,
  addPoints
} = require('../controllers/gamificationController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/leaderboard', getLeaderboard);

// Protected routes
router.use(protect);
router.get('/me', getMyStats);
router.post('/record-donation', recordDonation);

// Admin routes
router.post('/add-points', addPoints);

module.exports = router;
