const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  locationId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  totalSlots: {
    type: Number,
    default: 0
  },
  availableSlots: {
    type: Number,
    default: 0
  },
  pricing: {
    car: {
      type: Number,
      default: 15 // per 15 minutes
    },
    bike: {
      type: Number,
      default: 10 // per 15 minutes
    },
    bus: {
      type: Number,
      default: 25 // per 15 minutes
    },
    van: {
      type: Number,
      default: 20 // per 15 minutes
    },
    truck: {
      type: Number,
      default: 22 // per 15 minutes
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Location', locationSchema);
