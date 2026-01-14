const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  slotNo: {
    type: String,
    required: true
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
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
  status: {
    type: String,
    enum: ['available', 'booked', 'maintenance'],
    default: 'available'
  },
  vehicleType: {
    type: String,
    enum: ['all','car', 'bike', 'bus', 'van', 'truck'],
    default: 'all'
  },
  nextAvailableTime: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique slot numbers per location
slotSchema.index({ slotNo: 1, location: 1 }, { unique: true });

module.exports = mongoose.model('Slot', slotSchema);
