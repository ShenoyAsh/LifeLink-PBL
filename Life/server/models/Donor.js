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
  
  // --- Gamification & History Fields ---
  points: { type: Number, default: 0 },
  donationCount: { type: Number, default: 0 },
  badges: [{ type: String }], // e.g., ["First Saver", "LifeLink Hero"]
  lastDonationDate: { type: Date },
  
}, {
  timestamps: true,
});

// Create the 2dsphere index for geospatial queries
donorSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Donor', donorSchema);