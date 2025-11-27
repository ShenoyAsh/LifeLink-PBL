const express = require('express');
const router = express.Router();

const { registerDonor, verifyDonorOTP } = require('../controllers/authController');

// Register donor + send OTP
router.post('/register-donor', registerDonor);

// Verify donor OTP
router.post('/verify-donor-otp/:id', verifyDonorOTP);

module.exports = router;
