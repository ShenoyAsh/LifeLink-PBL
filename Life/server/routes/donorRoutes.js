const express = require('express');
const { getDonors, manualVerifyDonor, getDonorProfile } = require('../controllers/donorController');
const router = express.Router();

// @route   GET /api/donors
// @desc    Get list of all donors
router.get('/donors', getDonors);

// @route   GET /api/donors/profile/:email
// @desc    Get donor profile by email
router.get('/donors/profile/:email', getDonorProfile);

// @route   POST /api/admin/verify-donor/:id
// @desc    Manually verify a donor (Admin action)
// TODO: Protect this with admin JWT middleware
router.post('/admin/verify-donor/:id', manualVerifyDonor);

module.exports = router;