const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
  },
  coordinates: {
    type: [Number], // [lng, lat]
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
});

const emergencyRequestSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  requiredBloodType: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  unitsRequired: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  urgency: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    default: 'Medium',
  },
  location: {
    type: locationSchema,
    required: true,
  },
  hospital: {
    name: String,
    contact: String,
    address: String
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Fulfilled', 'Expired', 'Cancelled'],
    default: 'Pending',
  },
  timePosted: {
    type: Date,
    default: Date.now,
  },
  expiryTime: {
    type: Date,
    default: function() {
      const hours = { Critical: 4, High: 12, Medium: 24, Low: 48 }[this.urgency];
      return new Date(Date.now() + hours * 60 * 60 * 1000);
    }
  },
  matchedDonors: [{
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor' },
    status: { 
      type: String, 
      enum: ['Contacted', 'Accepted', 'Declined', 'Donated', 'No Response'],
      default: 'Contacted'
    },
    responseTime: Date,
    notes: String
  }],
  notes: String,
  priorityScore: {
    type: Number,
    default: function() {
      const urgencyScores = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      return urgencyScores[this.urgency];
    }
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringDetails: {
    frequency: String, // e.g., 'weekly', 'monthly'
    nextScheduled: Date,
    endDate: Date
  }
}, { timestamps: true });

emergencyRequestSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('EmergencyRequest', emergencyRequestSchema);
