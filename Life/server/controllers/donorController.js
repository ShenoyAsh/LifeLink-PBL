const Donor = require('../models/Donor');

/**
 * Get all donors
 */
const getDonors = async (req, res) => {
  try {
    // TODO: Add filters (e.g., ?verified=true)
    const donors = await Donor.find().sort({ createdAt: -1 });
    res.status(200).json(donors);
  } catch (error) {
    console.error('Error fetching donors:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Manually verify a donor (Admin)
 */
const manualVerifyDonor = async (req, res) => {
    const { id } = req.params;
    try {
        const donor = await Donor.findById(id);
        if (!donor) {
            return res.status(404).json({ message: 'Donor not found' });
        }
        
        donor.verified = true;
        donor.otpVerified = true; // Assume manual verify also bypasses OTP
        await donor.save();

        // TODO: Update Excel file "verified" status (complex read-modify-write)
        
        res.status(200).json({ message: 'Donor manually verified', donor });

    } catch (error) {
        console.error('Manual verify error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
const getDonorProfile = async (req, res) => {
  try {
    const { email } = req.params;
    const donor = await Donor.findOne({ email });

    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // Return only necessary public/gamification data
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
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getDonors,
  manualVerifyDonor,
  getDonorProfile
};