const DonationRequest = require('../models/DonationRequest');
const Donor = require('../models/Donor');

/**
 * Update the status of a donation request (e.g., Donor accepts, or Donation completes)
 */
const updateRequestStatus = async (req, res) => {
  const { requestId, status } = req.body; // status: 'Accepted', 'Rejected', 'Completed'

  try {
    const request = await DonationRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = status;
    request.respondedAt = new Date();

    // --- Gamification Logic ---
    if (status === 'Completed') {
      request.completedAt = new Date();
      
      // Find donor and update stats
      const donor = await Donor.findById(request.donorId);
      if (donor) {
        donor.donationCount = (donor.donationCount || 0) + 1;
        donor.points = (donor.points || 0) + 50; // 50 points per donation
        donor.lastDonationDate = new Date();

        // Award Badges
        if (donor.donationCount === 1 && !donor.badges.includes('First Saver')) {
          donor.badges.push('First Saver');
        }
        if (donor.donationCount >= 5 && !donor.badges.includes('High Five Hero')) {
          donor.badges.push('High Five Hero');
        }
        if (donor.points >= 500 && !donor.badges.includes('Legend')) {
            donor.badges.push('Legend');
        }

        await donor.save();
      }
    }

    await request.save();
    res.status(200).json({ message: `Request updated to ${status}`, request });

  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ message: 'Server error updating request' });
  }
};

module.exports = { updateRequestStatus };