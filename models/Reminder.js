const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itemType: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    default: ''
  },
  attachment: {
    type: String,
    default: ''
  },
  expiryDate: {
    type: Date,
    required: true
  },
  notifyBeforeDays: {
    type: [Number],
    default: [1, 3, 7]
  }
  ,
  notificationsSent: {
    type: [
      {
        daysBefore: Number,
        sentAt: Date
      }
    ],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Reminder', reminderSchema);

