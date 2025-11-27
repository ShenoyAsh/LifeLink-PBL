const express = require('express');
const { getDonors, manualVerifyDonor } = require('../controllers/donorController');
const router = express.Router();

// @route   GET /api/donors
// @desc    Get list of all donors
router.get('/donors', getDonors);

// @route   POST /api/admin/verify-donor/:id
// @desc    Manually verify a donor (Admin action)
// TODO: Protect this with admin JWT middleware
router.post('/admin/verify-donor/:id', manualVerifyDonor);
router.get('/profile/:email', getDonorProfile);

module.exports = router;