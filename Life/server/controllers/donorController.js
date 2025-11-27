const Donor = require('../models/Donor');
const { sendOTPEmail } = require('../utils/emailHelper');

// --- Register Donor ---
const registerDonor = async (req, res) => {
  const { name, email, phone, bloodType, location, availability } = req.body;

  try {
    // Force email to lowercase to ensure consistency
    const normalizedEmail = email.toLowerCase().trim();

    // Check if donor already exists
    let donor = await Donor.findOne({ email: normalizedEmail });
    if (donor) {
      return res.status(400).json({ message: 'Donor already exists with this email' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create new donor
    donor = new Donor({
      name,
      email: normalizedEmail,
      phone,
      bloodType,
      location,
      availability,
      otp,
      otpExpires,
      verified: false, // Not verified until OTP is checked
    });

    await donor.save();

    // Send OTP Email
    await sendOTPEmail(normalizedEmail, otp);

    res.status(201).json({ message: 'Donor registered. Please verify OTP sent to your email.' });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// --- Verify OTP ---
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const donor = await Donor.findOne({ email: normalizedEmail });

    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    if (donor.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (donor.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP expired. Please register again.' });
    }

    // Verify the donor
    donor.verified = true;
    donor.otpVerified = true;
    donor.otp = undefined; // Clear OTP
    donor.otpExpires = undefined;
    
    // Initialize gamification stats if they don't exist
    if (donor.points === undefined) donor.points = 0;
    if (donor.donationCount === undefined) donor.donationCount = 0;
    if (!donor.badges) donor.badges = [];

    await donor.save();

    res.status(200).json({ message: 'Email verified successfully! You are now a registered donor.' });
  } catch (error) {
    console.error('OTP Verify Error:', error);
    res.status(500).json({ message: 'Server error verifying OTP' });
  }
};

// --- Get Donor Profile (Fix for "Donor Not Found") ---
// --- Get All Donors (with pagination) ---
const getDonors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (req.query.bloodType) {
      query.bloodType = req.query.bloodType;
    }
    if (req.query.available === 'true') {
      query.availability = true;
    }
    if (req.query.verified === 'true') {
      query.verified = true;
    }

    const [donors, total] = await Promise.all([
      Donor.find(query)
        .select('-otp -otpExpires -__v') // Exclude sensitive/irrelevant fields
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Donor.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: donors.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: donors
    });
  } catch (error) {
    console.error('Get Donors Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching donors' });
  }
};

// --- Get Donor Profile ---
const getDonorProfile = async (req, res) => {
  try {
    const { email } = req.params;
    
    // CRITICAL FIX: Normalize the email to lowercase before searching
    // This ensures 'User@Example.com' finds 'user@example.com'
    const normalizedEmail = email.toLowerCase().trim();
    
    const donor = await Donor.findOne({ email: normalizedEmail });

    if (!donor) {
      return res.status(404).json({ message: 'Donor not found. Please check the email or register.' });
    }

    // Return profile data
    const profile = {
      name: donor.name,
      bloodType: donor.bloodType,
      location: donor.location.name,
      points: donor.points || 0,
      donationCount: donor.donationCount || 0,
      badges: donor.badges || [],
      availability: donor.availability,
      joinedAt: donor.createdAt
    };

    res.status(200).json(profile);
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- Manual Donor Verification (Admin) ---
const manualVerifyDonor = async (req, res) => {
  try {
    const { id } = req.params;
    
    const donor = await Donor.findById(id);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    // Update verification status
    donor.verified = true;
    donor.otpVerified = true; // Mark as verified
    donor.otp = undefined;
    donor.otpExpires = undefined;
    
    await donor.save();

    res.status(200).json({ 
      success: true, 
      message: 'Donor verified successfully',
      data: {
        id: donor._id,
        name: donor.name,
        email: donor.email,
        verified: donor.verified
      }
    });
  } catch (error) {
    console.error('Manual Verify Error:', error);
    res.status(500).json({ success: false, message: 'Server error during manual verification' });
  }
};

module.exports = {
  registerDonor,
  verifyOTP,
  getDonorProfile,
  getDonors,
  manualVerifyDonor
};