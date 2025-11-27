const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true,
  },
  name: {
    type: String, // e.g., "Indiranagar, Bengaluru"
    required: true,
  },
});

const donorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true, unique: true },
  bloodType: { 
    type: String, 
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  location: {
    type: locationSchema,
    required: true,
  },
  verified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
  otpVerified: { type: Boolean, default: false },
  availability: { type: Boolean, default: true },
  
  // --- Enhanced Gamification & Tracking ---
  points: { 
    type: Number, 
    default: 0,
    min: 0
  },
  donationCount: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  badges: [{ 
    name: { type: String, required: true },
    description: String,
    earnedOn: { type: Date, default: Date.now },
    icon: String
  }],
  lastDonationDate: { type: Date },
  totalLivesImpacted: { type: Number, default: 0 },
  donationHistory: [{
    date: { type: Date, default: Date.now },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    pointsEarned: { type: Number, default: 0 },
    location: locationSchema,
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled'
    }
  }],
  notificationPreferences: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    emergencyOnly: { type: Boolean, default: false }
  },
  achievements: {
    firstDonation: { type: Boolean, default: false },
    regularDonor: { type: Boolean, default: false },
    emergencyHero: { type: Boolean, default: false },
    rareBloodDonor: { type: Boolean, default: false }
  },
  lastActive: { type: Date, default: Date.now },
  isAvailableForEmergency: { type: Boolean, default: true },
  preferredDonationCenters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DonationCenter'
  }],
  
}, {
  timestamps: true,
});

// Create the 2dsphere index for geospatial queries
donorSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Donor', donorSchema);