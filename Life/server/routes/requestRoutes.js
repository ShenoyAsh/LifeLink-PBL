const express = require('express');
const { updateRequestStatus } = require('../controllers/requestController');
const router = express.Router();

// @route   POST /api/request/update-status
// @desc    Update status (Accept/Reject/Complete) and trigger gamification
router.post('/update-status', updateRequestStatus);

module.exports = router;