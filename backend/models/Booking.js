const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  slot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Slot',
    required: true
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  },
  vehicleNumber: {
    type: String,
    required: true,
    uppercase: true
  },
  vehicleType: {
    type: String,
    enum: ['car', 'bike', 'bus', 'van', 'truck'],
    required: true
  },
  bookingDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  actualStartTime: {
    type: Date,
    default: null
  },
  actualEndTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  baseAmount: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: String,
    default: null
  },
  bookingStatus: {
    type: String,
    enum: ['upcoming', 'active', 'completed', 'cancelled', 'no-show'],
    default: 'upcoming'
  },
  timerStarted: {
    type: Boolean,
    default: false
  },
  timerEndedAt: {
    type: Date,
    default: null
  },
  cancellationReason: {
    type: String,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
bookingSchema.index({ user: 1, bookingStatus: 1 });
bookingSchema.index({ slot: 1, startTime: 1 });
bookingSchema.index({ location: 1, bookingDate: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
