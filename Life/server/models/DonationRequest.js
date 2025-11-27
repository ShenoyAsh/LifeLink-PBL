const mongoose = require('mongoose');

const donationRequestSchema = new mongoose.Schema({
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true 
  },
  donorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Donor', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Accepted', 'Rejected', 'Completed', 'Cancelled'], 
    default: 'Pending' 
  },
  requestedAt: { 
    type: Date, 
    default: Date.now 
  },
  respondedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
});

module.exports = mongoose.model('DonationRequest', donationRequestSchema);