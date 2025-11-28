const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  bloodBank: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodBank',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  startTime: {
    type: String,  // Storing as "HH:MM" format
    required: true
  },
  endTime: {
    type: String,  // Storing as "HH:MM" format
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
    default: 'PENDING',
    index: true
  },
  donationType: {
    type: String,
    enum: ['WHOLE_BLOOD', 'PLATELETS', 'PLASMA', 'DOUBLE_RED_CELLS'],
    default: 'WHOLE_BLOOD'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  // For tracking appointment lifecycle
  confirmedAt: Date,
  cancelledAt: Date,
  completedAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // For donor eligibility questionnaire
  eligibilityAnswers: [{
    question: String,
    answer: mongoose.Schema.Types.Mixed
  }],
  // For reminders
  reminderSent: {
    type: Boolean,
    default: false
  },
  // For feedback after donation
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster querying
appointmentSchema.index({ donor: 1, date: 1, status: 1 });
appointmentSchema.index({ bloodBank: 1, date: 1, status: 1 });

// Virtual for appointment duration in minutes
appointmentSchema.virtual('duration').get(function() {
  const [startH, startM] = this.startTime.split(':').map(Number);
  const [endH, endM] = this.endTime.split(':').map(Number);
  return (endH * 60 + endM) - (startH * 60 + startM);
});

// Virtual for checking if appointment is upcoming
appointmentSchema.virtual('isUpcoming').get(function() {
  const now = new Date();
  const appointmentDate = new Date(this.date);
  const [hours, minutes] = this.startTime.split(':').map(Number);
  appointmentDate.setHours(hours, minutes, 0, 0);
  
  return appointmentDate > now && this.status === 'CONFIRMED';
});

// Pre-save hook to handle status changes
appointmentSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    const now = new Date();
    
    if (this.status === 'CONFIRMED' && !this.confirmedAt) {
      this.confirmedAt = now;
    } else if (this.status === 'CANCELLED' && !this.cancelledAt) {
      this.cancelledAt = now;
    } else if (this.status === 'COMPLETED' && !this.completedAt) {
      this.completedAt = now;
    }
  }
  
  next();
});

// Static method to check slot availability
appointmentSchema.statics.isSlotAvailable = async function(bloodBankId, date, startTime, endTime, excludeAppointmentId = null) {
  const query = {
    bloodBank: bloodBankId,
    date: new Date(date),
    status: { $in: ['PENDING', 'CONFIRMED'] },
    $or: [
      // New appointment starts during an existing appointment
      { 
        startTime: { $lt: endTime },
        endTime: { $gt: startTime }
      },
      // New appointment ends during an existing appointment
      {
        startTime: { $lt: endTime },
        endTime: { $gt: startTime }
      },
      // New appointment completely contains an existing appointment
      {
        startTime: { $gte: startTime },
        endTime: { $lte: endTime }
      }
    ]
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  const count = await this.countDocuments(query);
  return count === 0;
};

// Static method to get available time slots
appointmentSchema.statics.getAvailableSlots = async function(bloodBankId, date, duration = 30) {
  const bloodBank = await mongoose.model('BloodBank').findById(bloodBankId);
  if (!bloodBank) {
    throw new Error('Blood bank not found');
  }

  const { workingHours } = bloodBank;
  const selectedDate = new Date(date);
  const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  
  if (!workingHours[dayOfWeek] || !workingHours[dayOfWeek].isOpen) {
    return []; // Blood bank is closed on this day
  }

  const { open, close } = workingHours[dayOfWeek];
  const slots = [];
  const slotDuration = duration; // in minutes
  
  // Parse working hours
  const [openHour, openMinute] = open.split(':').map(Number);
  const [closeHour, closeMinute] = close.split(':').map(Number);
  
  const startTime = new Date(selectedDate);
  startTime.setHours(openHour, openMinute, 0, 0);
  
  const endTime = new Date(selectedDate);
  endTime.setHours(closeHour, closeMinute, 0, 0);
  
  // Get all appointments for the day
  const appointments = await this.find({
    bloodBank: bloodBankId,
    date: selectedDate,
    status: { $in: ['PENDING', 'CONFIRMED'] }
  }).sort('startTime');
  
  // Generate all possible slots
  const allSlots = [];
  const currentSlot = new Date(startTime);
  
  while (currentSlot < endTime) {
    const slotEnd = new Date(currentSlot.getTime() + slotDuration * 60000);
    
    if (slotEnd <= endTime) {
      allSlots.push({
        start: new Date(currentSlot),
        end: new Date(slotEnd),
        startStr: currentSlot.toTimeString().slice(0, 5),
        endStr: slotEnd.toTimeString().slice(0, 5),
        available: true
      });
    }
    
    currentSlot.setTime(currentSlot.getTime() + 15 * 60000); // Next slot starts 15 minutes later
  }
  
  // Mark unavailable slots
  for (const appointment of appointments) {
    const [apptStartH, apptStartM] = appointment.startTime.split(':').map(Number);
    const [apptEndH, apptEndM] = appointment.endTime.split(':').map(Number);
    
    const apptStart = new Date(selectedDate);
    apptStart.setHours(apptStartH, apptStartM, 0, 0);
    
    const apptEnd = new Date(selectedDate);
    apptEnd.setHours(apptEndH, apptEndM, 0, 0);
    
    // Mark overlapping slots as unavailable
    for (const slot of allSlots) {
      if (slot.start < apptEnd && slot.end > apptStart) {
        slot.available = false;
        slot.bookedBy = appointment.donor;
      }
    }
  }
  
  // Filter and return only available slots
  return allSlots.filter(slot => slot.available);
};

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
