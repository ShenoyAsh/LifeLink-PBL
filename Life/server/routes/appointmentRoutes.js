const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getAvailableSlots,
  getMyAppointments,
  updateAppointmentStatus,
  getAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentStats
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

// Public routes (if any)

// Protected routes
router.use(protect);

// Get available time slots
router.get('/available-slots', getAvailableSlots);

// Get user's appointments
router.get('/my-appointments', getMyAppointments);

// Get appointment statistics
router.get('/stats', authorize('ADMIN', 'HOSPITAL', 'BLOOD_BANK'), getAppointmentStats);

// Create new appointment
router.post('/', createAppointment);

// Get appointment by ID
router.get('/:id', getAppointment);

// Update appointment
router.put('/:id', updateAppointment);

// Update appointment status
router.patch('/:id/status', updateAppointmentStatus);

// Delete appointment
router.delete('/:id', deleteAppointment);

module.exports = router;
