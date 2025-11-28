const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware'); // Updated path to authMiddleware
const {
  getShortagePredictions,
  getMitigationStrategies,
  getInventoryStatus
} = require('../controllers/predictionController');

const router = express.Router();

// All routes are protected and require admin privileges
router.use(protect);
router.use(authorize('admin', 'bloodBankAdmin'));

router.get('/shortage', getShortagePredictions);
router.get('/strategies', getMitigationStrategies);
router.get('/inventory-status', getInventoryStatus);

module.exports = router;