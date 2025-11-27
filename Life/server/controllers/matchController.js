const Patient = require('../models/Patient');
const Donor = require('../models/Donor');
const DonationRequest = require('../models/DonationRequest');
const { sendAlertEmail } = require('../utils/emailHelper');

// --- Blood Type Compatibility Matrix ---
const compatibilityMatrix = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'],
};

/**
 * Find compatible donors with filters
 */
const findMatch = async (req, res) => {
  const { patientId, radiusKm, name, bloodType } = req.query;

  if (!patientId) {
    return res.status(400).json({ message: 'Patient ID is required' });
  }

  const radiusMeters = (radiusKm || 10) * 1000; // Default 10km

  try {
    // 1. Get Patient Details
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // 2. Determine compatible blood types
    const compatibleTypes = compatibilityMatrix[patient.bloodType];
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

    // 5. Run Geospatial Aggregation
    const matches = await Donor.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: patientCoords,
          },
          distanceField: 'distanceMeters', 
          maxDistance: parseFloat(radiusMeters),
          spherical: true,
          query: matchQuery, // Injected dynamic query
        },
      },
      {
        $sort: { distanceMeters: 1 },
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
          distanceKm: { $divide: ['$distanceMeters', 1000] }, 
        },
      },
    ]);

    res.status(200).json(matches);

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