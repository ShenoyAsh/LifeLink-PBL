const Appointment = require('../models/Appointment');
const BloodBank = require('../models/BloodBank');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');
const { APPOINTMENT_CONFIRMATION, APPOINTMENT_REMINDER } = require('../constants/emailTemplates');

// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Private
exports.createAppointment = async (req, res) => {
  try {
    const { bloodBank, date, startTime, endTime, donationType, notes } = req.body;
    const donor = req.user.id;

    // Validate blood bank exists
    const bloodBankExists = await BloodBank.findById(bloodBank);
    if (!bloodBankExists) {
      return res.status(404).json({ success: false, message: 'Blood bank not found' });
    }

    // Check if slot is available
    const isAvailable = await Appointment.isSlotAvailable(bloodBank, date, startTime, endTime);
    if (!isAvailable) {
      return res.status(400).json({ 
        success: false, 
        message: 'The selected time slot is no longer available' 
      });
    }

    // Create appointment
    const appointment = new Appointment({
      donor,
      bloodBank,
      date,
      startTime,
      endTime,
      donationType,
      notes,
      status: 'PENDING'
    });

    await appointment.save();

    // Populate donor and blood bank details
    await appointment.populate('donor', 'name email phone')
                    .populate('bloodBank', 'name email phone address')
                    .execPopulate();

    // Send confirmation email
    await sendEmail({
      to: appointment.donor.email,
      subject: 'Appointment Scheduled - LifeLink',
      html: APPOINTMENT_CONFIRMATION(appointment)
    });

    // Notify blood bank (if they have notifications enabled)
    if (bloodBankExists.notificationsEnabled && bloodBankExists.email) {
      await sendEmail({
        to: bloodBankExists.email,
        subject: 'New Donation Appointment',
        html: `A new appointment has been scheduled by ${appointment.donor.name}.`
      });
    }

    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating appointment',
      error: error.message 
    });
  }
};

// @desc    Get available time slots for a blood bank
// @route   GET /api/appointments/available-slots
// @access  Private
exports.getAvailableSlots = async (req, res) => {
  try {
    const { bloodBankId, date, duration = 30 } = req.query;
    
    if (!bloodBankId || !date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Blood bank ID and date are required' 
      });
    }

    const slots = await Appointment.getAvailableSlots(bloodBankId, date, parseInt(duration));
    
    res.status(200).json({
      success: true,
      count: slots.length,
      data: slots
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching available slots',
      error: error.message 
    });
  }
};

// @desc    Get user's appointments
// @route   GET /api/appointments/my-appointments
// @access  Private
exports.getMyAppointments = async (req, res) => {
  try {
    const { status, upcoming } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = {};
    
    if (userRole === 'DONOR') {
      query.donor = userId;
    } else if (userRole === 'HOSPITAL' || userRole === 'BLOOD_BANK') {
      query.bloodBank = req.user.bloodBank || req.user.hospital;
    } else if (userRole !== 'ADMIN') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to access this resource' 
      });
    }

    if (status) {
      query.status = status.toUpperCase();
    }

    if (upcoming === 'true') {
      query.date = { $gte: new Date() };
      query.status = 'CONFIRMED';
    }

    const appointments = await Appointment.find(query)
      .populate('donor', 'name email phone bloodGroup')
      .populate('bloodBank', 'name address phone')
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching appointments',
      error: error.message 
    });
  }
};

// @desc    Update appointment status
// @route   PATCH /api/appointments/:id/status
// @access  Private
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancellationReason } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const appointment = await Appointment.findById(id)
      .populate('donor', 'name email phone')
      .populate('bloodBank', 'name email phone');

    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Appointment not found' 
      });
    }

    // Authorization check
    if (userRole === 'DONOR' && !appointment.donor._id.equals(userId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this appointment' 
      });
    }

    if ((userRole === 'HOSPITAL' || userRole === 'BLOOD_BANK') && 
        !appointment.bloodBank._id.equals(req.user.bloodBank || req.user.hospital)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this appointment' 
      });
    }

    // Status transition validation
    const validTransitions = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
      CANCELLED: [],
      COMPLETED: [],
      NO_SHOW: []
    };

    if (!validTransitions[appointment.status].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status transition from ${appointment.status} to ${status}` 
      });
    }

    // Update appointment
    appointment.status = status;
    appointment.cancellationReason = cancellationReason;
    
    if (status === 'CANCELLED') {
      appointment.cancelledBy = userId;
    }

    await appointment.save();

    // Send notifications
    if (status === 'CONFIRMED') {
      await sendEmail({
        to: appointment.donor.email,
        subject: 'Appointment Confirmed - LifeLink',
        html: APPOINTMENT_CONFIRMATION(appointment, true)
      });
    } else if (status === 'CANCELLED') {
      const cancelledByUser = await User.findById(userId).select('name');
      const recipient = userRole === 'DONOR' ? appointment.bloodBank.email : appointment.donor.email;
      
      await sendEmail({
        to: recipient,
        subject: 'Appointment Cancelled',
        html: `
          <p>Your appointment scheduled for ${appointment.date.toDateString()} at ${appointment.startTime} has been cancelled.</p>
          ${cancellationReason ? `<p>Reason: ${cancellationReason}</p>` : ''}
          <p>Cancelled by: ${cancelledByUser.name}</p>
        `
      });
    }

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating appointment status',
      error: error.message 
    });
  }
};

// @desc    Get appointment by ID
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('donor', 'name email phone bloodGroup')
      .populate('bloodBank', 'name address phone');

    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Appointment not found' 
      });
    }

    // Authorization check
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const isAuthorized = 
      appointment.donor._id.equals(userId) ||
      appointment.bloodBank._id.equals(req.user.bloodBank || req.user.hospital) ||
      userRole === 'ADMIN';
    
    if (!isAuthorized) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to view this appointment' 
      });
    }

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching appointment',
      error: error.message 
    });
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
exports.updateAppointment = async (req, res) => {
  try {
    const { date, startTime, endTime, donationType, notes } = req.body;
    
    const appointment = await Appointment.findById(req.params.id)
      .populate('donor', 'name email phone')
      .populate('bloodBank', 'name email phone');

    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Appointment not found' 
      });
    }

    // Authorization check
    if (req.user.role === 'DONOR' && !appointment.donor._id.equals(req.user.id)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this appointment' 
      });
    }

    // Check if the new slot is available (if date/time is being changed)
    if ((date && date !== appointment.date.toISOString().split('T')[0]) || 
        startTime || endTime) {
      
      const checkDate = date ? new Date(date) : appointment.date;
      const checkStartTime = startTime || appointment.startTime;
      const checkEndTime = endTime || appointment.endTime;
      
      const isAvailable = await Appointment.isSlotAvailable(
        appointment.bloodBank._id, 
        checkDate, 
        checkStartTime, 
        checkEndTime,
        appointment._id
      );
      
      if (!isAvailable) {
        return res.status(400).json({ 
          success: false, 
          message: 'The selected time slot is not available' 
        });
      }
    }

    // Update fields
    if (date) appointment.date = date;
    if (startTime) appointment.startTime = startTime;
    if (endTime) appointment.endTime = endTime;
    if (donationType) appointment.donationType = donationType;
    if (notes !== undefined) appointment.notes = notes;

    await appointment.save();

    // Send update notification
    await sendEmail({
      to: appointment.donor.email,
      subject: 'Appointment Updated - LifeLink',
      html: `
        <p>Your appointment has been updated:</p>
        <p>Date: ${appointment.date.toDateString()}</p>
        <p>Time: ${appointment.startTime} - ${appointment.endTime}</p>
        <p>Location: ${appointment.bloodBank.name}</p>
        <p>Status: ${appointment.status}</p>
      `
    });

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating appointment',
      error: error.message 
    });
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private
exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Appointment not found' 
      });
    }

    // Authorization check
    if (req.user.role === 'DONOR' && !appointment.donor.equals(req.user.id)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this appointment' 
      });
    }

    await appointment.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting appointment',
      error: error.message 
    });
  }
};

// @desc    Get appointment statistics
// @route   GET /api/appointments/stats
// @access  Private/Admin
exports.getAppointmentStats = async (req, res) => {
  try {
    const { startDate, endDate, bloodBankId } = req.query;
    
    const match = {};
    
    // Date range filter
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        match.date.$lte = end;
      }
    }
    
    // Blood bank filter
    if (bloodBankId) {
      match.bloodBank = mongoose.Types.ObjectId(bloodBankId);
    }
    
    // Hospital/Blood bank filter for non-admin users
    if (req.user.role === 'HOSPITAL' || req.user.role === 'BLOOD_BANK') {
      match.bloodBank = req.user.bloodBank || req.user.hospital;
    } else if (req.user.role === 'DONOR') {
      match.donor = req.user.id;
    }
    
    const stats = await Appointment.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          appointments: { $push: '$$ROOT' }
        }
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1
        }
      }
    ]);
    
    // Get total count
    const total = stats.reduce((sum, item) => sum + item.count, 0);
    
    // Format response
    const result = {
      total,
      byStatus: {}
    };
    
    stats.forEach(stat => {
      result.byStatus[stat.status] = stat.count;
    });
    
    // Add blood bank details if filtered by blood bank
    if (bloodBankId) {
      const bloodBank = await BloodBank.findById(bloodBankId)
        .select('name address phone');
      
      if (bloodBank) {
        result.bloodBank = bloodBank;
      }
    }
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching appointment stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching appointment statistics',
      error: error.message 
    });
  }
};
