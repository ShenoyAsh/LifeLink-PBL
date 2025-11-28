const mongoose = require('mongoose');

const bloodInventorySchema = new mongoose.Schema({
  bloodBank: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodBank',
    required: true
  },
  bloodType: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  criticalLevel: {
    type: Number,
    required: true,
    default: 5,
    min: 0
  },
  status: {
    type: String,
    enum: ['CRITICAL', 'LOW', 'NORMAL', 'HIGH'],
    default: 'NORMAL',
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  donationDate: {
    type: Date,
    default: Date.now
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional, for tracking if available
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster queries
bloodInventorySchema.index({ bloodBank: 1, bloodType: 1 });
bloodInventorySchema.index({ status: 1 });
bloodInventorySchema.index({ expiryDate: 1 });

// Virtual for days until expiry
bloodInventorySchema.virtual('daysUntilExpiry').get(function() {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const today = new Date();
  const diffDays = Math.round((this.expiryDate - today) / oneDay);
  return diffDays > 0 ? diffDays : 0;
});

// Pre-save hook to update status based on quantity
bloodInventorySchema.pre('save', function(next) {
  if (this.isModified('quantity')) {
    if (this.quantity <= 0) {
      this.status = 'CRITICAL';
    } else if (this.quantity <= this.criticalLevel) {
      this.status = 'LOW';
    } else if (this.quantity > this.criticalLevel * 3) {
      this.status = 'HIGH';
    } else {
      this.status = 'NORMAL';
    }
    this.lastUpdated = Date.now();
  }
  next();
});

// Static method to get current inventory summary for a blood bank
bloodInventorySchema.statics.getInventorySummary = async function(bloodBankId) {
  return this.aggregate([
    {
      $match: { bloodBank: mongoose.Types.ObjectId(bloodBankId) }
    },
    {
      $group: {
        _id: '$bloodType',
        total: { $sum: '$quantity' },
        critical: {
          $sum: {
            $cond: [{ $eq: ['$status', 'CRITICAL'] }, 1, 0]
          }
        },
        low: {
          $sum: {
            $cond: [{ $eq: ['$status', 'LOW'] }, 1, 0]
          }
        },
        normal: {
          $sum: {
            $cond: [{ $eq: ['$status', 'NORMAL'] }, 1, 0]
          }
        },
        high: {
          $sum: {
            $cond: [{ $eq: ['$status', 'HIGH'] }, 1, 0]
          }
        },
        expiringSoon: {
          $sum: {
            $cond: [
              { $lte: [
                { $subtract: ['$expiryDate', new Date()] },
                7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
              ]},
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
        statusSummary: {
          critical: '$critical',
          low: '$low',
          normal: '$normal',
          high: '$high',
          expiringSoon: '$expiringSoon'
        },
        _id: 0
      }
    },
    {
      $sort: { bloodType: 1 }
    }
  ]);
};

// Static method to get expiring soon inventory
bloodInventorySchema.statics.getExpiringSoon = function(bloodBankId, days = 7) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  
  return this.find({
    bloodBank: bloodBankId,
    expiryDate: { $lte: date, $gte: new Date() },
    quantity: { $gt: 0 }
  }).sort('expiryDate');
};

// Static method to get low inventory items
bloodInventorySchema.statics.getLowInventory = function(bloodBankId) {
  return this.find({
    bloodBank: bloodBankId,
    status: { $in: ['LOW', 'CRITICAL'] },
    quantity: { $gt: 0 }
  }).sort('status quantity');
};

// Static method to update inventory (add or remove units)
bloodInventorySchema.statics.updateInventory = async function(
  bloodBankId, 
  bloodType, 
  quantityChange, 
  options = {}
) {
  const { session = null, notes = '', donorId = null } = options;
  
  const update = {
    $inc: { quantity: quantityChange },
    $set: { lastUpdated: new Date() },
    $push: {
      history: {
        date: new Date(),
        change: quantityChange,
        notes: notes || (quantityChange > 0 ? 'Stock added' : 'Stock used'),
        updatedBy: options.updatedBy || 'system'
      }
    }
  };
  
  if (donorId) {
    update.donor = donorId;
  }
  
  const query = {
    bloodBank: bloodBankId,
    bloodType: bloodType
  };
  
  const inventoryItem = await this.findOneAndUpdate(
    query,
    update,
    { 
      new: true, 
      upsert: true, 
      setDefaultsOnInsert: true,
      session 
    }
  );
  
  return inventoryItem;
};

// Add a text index for search functionality
bloodInventorySchema.index({
  'notes': 'text',
  'bloodType': 'text'
});

const BloodInventory = mongoose.model('BloodInventory', bloodInventorySchema);

module.exports = BloodInventory;
