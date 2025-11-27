const Patient = require('../models/Patient');
const Donor = require('../models/Donor');
const DonationRequest = require('../models/DonationRequest'); // Import new model
const { sendAlertEmail } = require('../utils/emailHelper');

// --- Blood Type Compatibility Matrix ---
const compatibilityMatrix = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal Recipient
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'], // Universal Donor
};

/**
 * Find compatible donors
 */
const findMatch = async (req, res) => {
  const { patientId, radiusKm } = req.query;

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
    const patientCoords = patient.location.coordinates; // [lng, lat]

    // 4. Run Geospatial Aggregation
    const matches = await Donor.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: patientCoords,
          },
          distanceField: 'distanceMeters', 
          maxDistance: radiusMeters,
          spherical: true,
          query: {
            bloodType: { $in: compatibleTypes },
            verified: true,
            otpVerified: true,
            availability: true,
          },
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
          badges: 1, // Include badges in output
          points: 1, // Include points in output
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

/**
 * Send an alert to a matched donor and track the request
 */
const sendAlert = async (req, res) => {
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