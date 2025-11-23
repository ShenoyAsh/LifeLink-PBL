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
    type: String,
    required: true,
  },
});

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  phone: { type: String, required: true },
  bloodType: { 
    type: String, 
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  location: {
    type: locationSchema,
    required: true,
  },
  urgency: {
  type: String,
  enum: ['Critical', 'High', 'Medium', 'Low'], // ✅ Add Critical
  default: 'Medium'
}
,
  // Optional: organNeeded: { type: String, enum: ['Kidney', 'Liver', 'Heart', 'None'], default: 'None' }
}, {
  timestamps: true,
});

// Index for patient location (optional, but good practice)
patientSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Patient', patientSchema);