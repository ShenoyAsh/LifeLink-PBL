const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const BloodInventory = require('../models/BloodInventory');
const predictionService = require('../services/predictionService');

// @desc    Get blood shortage predictions
// @route   GET /api/v1/predictions/shortage
// @access  Private/Admin
const getShortagePredictions = asyncHandler(async (req, res, next) => {
  const { daysAhead = 7, bloodBankId } = req.query;
  
  // Default to user's blood bank if admin doesn't specify
  const targetBloodBankId = bloodBankId || (req.user.bloodBank ? req.user.bloodBank._id : null);
  
  if (!targetBloodBankId) {
    return next(new ErrorResponse('Blood bank ID is required', 400));
  }

  try {
    const predictions = await predictionService.predictShortage(targetBloodBankId, parseInt(daysAhead));
    
    res.status(200).json({
      success: true,
      data: predictions
    });
  } catch (error) {
    console.error('Prediction error:', error);
    return next(new ErrorResponse('Error generating predictions', 500));
  }
});

// @desc    Get mitigation strategies for blood type
// @route   GET /api/v1/predictions/strategies
// @access  Private/Admin
const getMitigationStrategies = asyncHandler(async (req, res, next) => {
  const { bloodType, riskLevel } = req.query;
  
  if (!bloodType || !riskLevel) {
    return next(new ErrorResponse('Blood type and risk level are required', 400));
  }

  try {
    const strategies = await predictionService.getShortageMitigationStrategies(bloodType, riskLevel);
    
    res.status(200).json({
      success: true,
      data: strategies
    });
  } catch (error) {
    console.error('Strategy generation error:', error);
    return next(new ErrorResponse('Error generating strategies', 500));
  }
});

// @desc    Get current inventory status
// @route   GET /api/v1/predictions/inventory-status
// @access  Private/Admin
const getInventoryStatus = asyncHandler(async (req, res, next) => {
  const { bloodBankId } = req.query;
  const targetBloodBankId = bloodBankId || (req.user.bloodBank ? req.user.bloodBank._id : null);
  
  if (!targetBloodBankId) {
    return next(new ErrorResponse('Blood bank ID is required', 400));
  }

  try {
    const inventoryStatus = await BloodInventory.aggregate([
      {
        $match: { bloodBank: targetBloodBankId }
      },
      {
        $group: {
          _id: '$bloodType',
          total: { $sum: '$quantity' },
          status: { $push: '$status' },
          expiringSoon: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $lte: ['$expiryDate', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)] },
                    { $gte: ['$expiryDate', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          bloodType: '$_id',
          total: 1,
          status: 1,
          expiringSoon: 1,
          _id: 0
        }
      },
      { $sort: { bloodType: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: inventoryStatus
    });
  } catch (error) {
    console.error('Inventory status error:', error);
    return next(new ErrorResponse('Error fetching inventory status', 500));
  }
});

module.exports = {
  getShortagePredictions,
  getMitigationStrategies,
  getInventoryStatus
};
