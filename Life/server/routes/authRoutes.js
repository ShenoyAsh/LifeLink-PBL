const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const { 
  register, 
  login, 
  getMe,
  registerDonor, 
  verifyDonorOTP 
} = require('../controllers/authController');

// Standard Auth
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', protect, getMe);

// Specific Donor Registration (OTP Flow)
router.post('/register-donor', registerDonor);
router.post('/verify-donor-otp/:id', verifyDonorOTP);

module.exports = router;