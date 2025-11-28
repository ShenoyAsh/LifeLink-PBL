const Patient = require('../models/Patient');
const Donor = require('../models/Donor');
const DonationRequest = require('../models/DonationRequest');
const { sendAlertEmail } = require('../utils/emailHelper');

// --- Blood Type Compatibility Matrix with Scores ---
const bloodTypeScores = {
  'O-': { score: 1.0, compatibleWith: ['O-'] },
  'O+': { score: 0.9, compatibleWith: ['O+', 'O-'] },
  'A-': { score: 0.8, compatibleWith: ['A-', 'O-'] },
  'A+': { score: 0.7, compatibleWith: ['A+', 'A-', 'O+', 'O-'] },
  'B-': { score: 0.8, compatibleWith: ['B-', 'O-'] },
  'B+': { score: 0.7, compatibleWith: ['B+', 'B-', 'O+', 'O-'] },
  'AB-': { score: 0.6, compatibleWith: ['A-', 'B-', 'AB-', 'O-'] },
  'AB+': { score: 0.5, compatibleWith: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
};

// Urgency levels with weights
const URGENCY_WEIGHTS = {
  'Critical': 1.2,
  'High': 1.1,
  'Medium': 1.0,
  'Low': 0.9
};

// Calculate compatibility score between patient and donor blood types
function calculateBloodTypeScore(patientType, donorType) {
  if (bloodTypeScores[patientType].compatibleWith.includes(donorType)) {
    return bloodTypeScores[donorType].score;
  }
  return 0;
}

// Calculate activity score based on donation history and response rate
async function calculateActivityScore(donorId) {
  const [donationHistory, totalRequests] = await Promise.all([
    DonationRequest.countDocuments({ donorId, status: 'Completed' }),
    DonationRequest.countDocuments({ donorId, status: { $in: ['Accepted', 'Rejected'] } })
  ]);
  
  const responseRate = totalRequests > 0 
    ? donationHistory / totalRequests 
    : 0.5; // Default score for new donors
    
  // Normalize to 0-1 range
  return Math.min(1, 0.5 + (responseRate * 0.5));
}

// Calculate distance-based score (0-1)
function calculateDistanceScore(distanceMeters, maxDistance = 50000) {
  // Convert to km and normalize
  const distanceKm = distanceMeters / 1000;
  // Exponential decay based on distance
  return Math.exp(-0.5 * (distanceKm / (maxDistance / 10)));
}

/**
 * Find compatible donors with filters
 */
const findMatch = async (req, res) => {
  const { patientId, radiusKm, name, bloodType } = req.query;

  if (!patientId) {
    return res.status(400).json({ message: 'Patient ID is required' });
  }

  const radiusMeters = Math.min(parseInt(radiusKm || 50) * 1000, 200000); // Cap at 200km

  try {
    // 1. Get Patient Details
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // 2. Determine compatible blood types
    const compatibleTypes = bloodTypeScores[patient.bloodType].compatibleWith;
    if (!compatibleTypes) {
      return res.status(400).json({ message: 'Invalid patient blood type' });
    }
    
    // 3. Get Patient's coordinates
    const patientCoords = patient.location.coordinates;

    // 4. Build Dynamic Query
    let matchQuery = {
      bloodType: { $in: compatibleTypes },
      verified: true,
      otpVerified: true,
      availability: true,
    };

    // Apply Name Filter (Case-insensitive regex)
    if (name) {
      matchQuery.name = { $regex: name, $options: 'i' };
    }

    // Apply Specific Blood Type Filter (must still be compatible)
    if (bloodType) {
      if (compatibleTypes.includes(bloodType)) {
        matchQuery.bloodType = bloodType;
      } else {
        // If filtered type is incompatible, return empty immediately
        return res.status(200).json([]); 
      }
    }

    // 5. First, get basic matches with geospatial query
    const potentialDonors = await Donor.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: patientCoords,
          },
          distanceField: 'distanceMeters',
          maxDistance: parseFloat(radiusMeters),
          spherical: true,
          query: matchQuery,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          bloodType: 1,
          location: 1,
          availability: 1,
          badges: 1,
          points: 1,
          lastDonation: 1,
          donationCount: 1,
          responseRate: 1,
          distanceMeters: 1,
          distanceKm: { $divide: ['$distanceMeters', 1000] },
        },
      },
    ]);

    // 6. Calculate match scores for each donor
    const matches = await Promise.all(potentialDonors.map(async (donor) => {
      // Calculate individual component scores (0-1 range)
      const distanceScore = calculateDistanceScore(donor.distanceMeters, radiusMeters);
      const bloodTypeScore = calculateBloodTypeScore(patient.bloodType, donor.bloodType);
      const activityScore = await calculateActivityScore(donor._id);
      
      // Calculate final weighted score (0-100)
      const weightedScore = (
        (distanceScore * 0.4) + 
        (bloodTypeScore * 0.3) + 
        (activityScore * 0.2) +
        (patient.urgency ? (URGENCY_WEIGHTS[patient.urgency] * 0.1) : 0.1)
      ) * 100;

      // Add scoring metadata (for debugging and transparency)
      return {
        ...donor,
        matchScore: Math.round(weightedScore * 10) / 10, // 1 decimal place
        scoreBreakdown: {
          distance: Math.round(distanceScore * 100),
          bloodType: Math.round(bloodTypeScore * 100),
          activity: Math.round(activityScore * 100),
          urgency: patient.urgency || 'Medium'
        }
      };
    }));

    // Sort by match score (descending) and then by distance (ascending)
    matches.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return a.distanceMeters - b.distanceMeters;
    });

    // Limit to top 20 matches
    const topMatches = matches.slice(0, 20);

    res.status(200).json(topMatches);

  } catch (error) {
    console.error('Find match error:', error);
    res.status(500).json({ message: 'Server error finding matches' });
  }
};

// ... rest of the file (sendAlert) remains the same
const sendAlert = async (req, res) => {
  // ... existing sendAlert code ...
    const { donorId, patientId } = req.body;

  try {
    const donor = await Donor.findById(donorId);
    const patient = await Patient.findById(patientId);

    if (!donor || !patient) {
      return res.status(404).json({ message: 'Donor or Patient not found' });
    }

    // --- 1. Send Email Alert ---
    const emailSent = await sendAlertEmail(donor, patient);

    // --- 2. Simulate SMS ---
    console.log(`--- SIMULATED SMS PAYLOAD ---`);
    console.log(`TO: ${donor.phone}`);
    console.log(`BODY: URGENT: LifeLink match for patient ${patient.name}.`);
    console.log(`-------------------------------`);

    if (emailSent) {
      // --- 3. Track the Request (Closed Loop Logic) ---
      const newRequest = new DonationRequest({
        patientId: patient._id,
        donorId: donor._id,
        status: 'Pending'
      });
      await newRequest.save();

      res.status(200).json({ message: 'Alert sent and request tracked successfully' });
    } else {
      res.status(500).json({ message: 'Failed to send alert email' });
    }

  } catch (error) {
    console.error('Send alert error:', error);
    res.status(500).json({ message: 'Server error sending alert' });
  }
};

module.exports = {
  findMatch,
  sendAlert,
};