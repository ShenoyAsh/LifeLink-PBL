const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DonationRequest',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderType: {
    type: String,
    enum: ['DONOR', 'HOSPITAL', 'ADMIN'],
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  // For message status tracking
  status: {
    type: String,
    enum: ['SENT', 'DELIVERED', 'READ'],
    default: 'SENT'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster querying
chatMessageSchema.index({ requestId: 1, createdAt: -1 });

// Virtual for unread messages count
chatMessageSchema.virtual('isRead').get(function() {
  return this.readBy.length > 0;
});

// Method to mark message as read
chatMessageSchema.methods.markAsRead = function(userId) {
  if (!this.readBy.some(r => r.userId.equals(userId))) {
    this.readBy.push({ userId });
    this.status = 'READ';
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to get unread messages count
chatMessageSchema.statics.getUnreadCount = async function(userId, requestId) {
  return this.countDocuments({
    requestId,
    'readBy.userId': { $ne: userId },
    sender: { $ne: userId }
  });
};

// Static method to get chat participants
chatMessageSchema.statics.getChatParticipants = async function(requestId) {
  const participants = await this.distinct('sender', { requestId });
  return participants;
};

// Pre-save hook to update status
chatMessageSchema.pre('save', function(next) {
  if (this.readBy.length > 0) {
    this.status = 'READ';
  } else if (this.isNew) {
    this.status = 'SENT';
  }
  next();
});

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = ChatMessage;
