const Donor = require('../models/Donor');
const { validatePhone, validateEmail } = require('../utils/validate');
const { generateOTP, getOTPExpiry } = require('../utils/otpHelper');
const { sendOTPEmail } = require('../utils/emailHelper');
const { appendDonorToExcel } = require('../utils/excelHelper');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

/**
 * @desc    Register a new user (Standard)
 * @route   POST /api/auth/register
 */
const register = async (req, res) => {
  const { name, email, password, role } = req.body; // Added role to destructuring

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please add all fields' });
  }

  try {
    // Check if user exists
    const userExists = await Donor.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await Donor.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'donor', // Default to donor if not specified
      location: { type: 'Point', coordinates: [0, 0], name: 'Unknown' }
    });

    if (user) {
      res.status(201).json({
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role, // Return role
        },
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * @desc    Authenticate a user
 * @route   POST /api/auth/login
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Donor.findOne({ email }).select('+password');

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          bloodType: user.bloodType,
          role: user.role, // Return role
        },
      });
    } else {
      res.status(400).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * @desc    Get user data
 * @route   GET /api/auth/me
 */
const getMe = async (req, res) => {
  res.status(200).json(req.user);
};

// --- EXISTING FUNCTIONS ---

/**
 * Register a new donor (Specific Flow with OTP)
 */
const registerDonor = async (req, res) => {
  const { name, email, phone, bloodType, locationName, lat, lng, availability } = req.body;

  // --- 1. Validation ---
  if (!name || !email || !phone || !bloodType || !locationName || !lat || !lng) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }
  if (!validatePhone(phone)) {
    return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
  }

  try {
    // Check for existing user
    let existingDonor = await Donor.findOne({ $or: [{ email }, { phone }] });
    if (existingDonor) {
      return res.status(409).json({ message: 'Email or phone number already registered' });
    }

    // --- 2. OTP Generation ---
    const otp = generateOTP();
    const otpExpires = getOTPExpiry();
    
    // --- 3. Create Donor in MongoDB ---
    const newDonor = new Donor({
      name,
      email,
      phone,
      bloodType,
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)],
        name: locationName,
      },
      availability: availability ?? true,
      otp: otp, 
      otpExpires,
      role: 'donor' // Explicitly set role
    });
    
    await newDonor.save();

    // --- 4. Sync to Excel (Atomic Append) ---
    appendDonorToExcel(newDonor);

    // --- 5. Send OTP Email ---
    const emailSent = await sendOTPEmail(email, otp);

    res.status(201).json({
      message: 'Donor registered. Please check your email for OTP.',
      donorId: newDonor._id,
      emailSent: emailSent,
    });

  } catch (error) {
    console.error('Donor registration error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email or phone already exists.' });
    }
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

/**
 * Verify Donor OTP
 */
const verifyDonorOTP = async (req, res) => {
  const { id } = req.params;
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({ message: 'OTP is required' });
  }

  try {
    const donor = await Donor.findById(id);

    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }
    if (donor.otpVerified) {
      return res.status(400).json({ message: 'Donor already verified' });
    }

    if (donor.otpExpires < new Date()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    const isMatch = donor.otp === otp;

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    donor.otpVerified = true;
    donor.verified = true; 
    donor.otp = undefined; 
    donor.otpExpires = undefined;
    
    await donor.save();

    res.status(200).json({ message: 'Donor verified successfully' });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  registerDonor,
  verifyDonorOTP,
};