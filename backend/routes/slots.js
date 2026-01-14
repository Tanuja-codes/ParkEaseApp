const express = require('express');
const router = express.Router();
const Slot = require('../models/Slot');
const Location = require('../models/Location');
const { auth, adminAuth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all slots for a location
router.get('/location/:locationId', async (req, res) => {
  try {
    const slots = await Slot.find({ 
      location: req.params.locationId,
      isActive: true 
    }).sort({ slotNo: 1 });
    
    res.json(slots);
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({ message: 'Error fetching slots', error: error.message });
  }
});

// Get available slots for booking
router.get('/location/:locationId/available', async (req, res) => {
  try {
    const { startTime, endTime } = req.query;
    
    const slots = await Slot.find({ 
      location: req.params.locationId,
      status: 'available',
      isActive: true,
      nextAvailableTime: { $lte: new Date(startTime) }
    }).sort({ slotNo: 1 });
    
    res.json(slots);
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ message: 'Error fetching available slots', error: error.message });
  }
});

// Create slot (admin only)
router.post('/',
  [auth, adminAuth],
  [
    body('slotNo').trim().notEmpty().withMessage('Slot number is required'),
    body('location').notEmpty().withMessage('Location is required'),
    body('latitude').isFloat().withMessage('Valid latitude is required'),
    body('longitude').isFloat().withMessage('Valid longitude is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { slotNo, location, latitude, longitude, vehicleType } = req.body;

      // Check if location exists
      const locationExists = await Location.findById(location);
      if (!locationExists) {
        return res.status(404).json({ message: 'Location not found' });
      }

      // Check if slot number already exists for this location
      const existingSlot = await Slot.findOne({ slotNo, location });
      if (existingSlot) {
        return res.status(400).json({ message: 'Slot number already exists for this location' });
      }

      const slot = new Slot({
        slotNo,
        location,
        latitude,
        longitude,
        vehicleType: vehicleType || 'car'
      });

      await slot.save();

      // Update location slot count
      locationExists.totalSlots += 1;
      locationExists.availableSlots += 1;
      await locationExists.save();

      res.status(201).json({
        message: 'Slot created successfully',
        slot
      });
    } catch (error) {
      console.error('Create slot error:', error);
      res.status(500).json({ message: 'Error creating slot', error: error.message });
    }
  }
);

// Update slot (admin only)
router.put('/:id',
  [auth, adminAuth],
  async (req, res) => {
    try {
      const { slotNo, latitude, longitude, vehicleType, nextAvailableTime } = req.body;

      const slot = await Slot.findById(req.params.id);
      if (!slot) {
        return res.status(404).json({ message: 'Slot not found' });
      }

      if (slotNo) slot.slotNo = slotNo;
      if (latitude) slot.latitude = latitude;
      if (longitude) slot.longitude = longitude;
      if (vehicleType) slot.vehicleType = vehicleType;
      if (nextAvailableTime) slot.nextAvailableTime = nextAvailableTime;

      await slot.save();

      res.json({
        message: 'Slot updated successfully',
        slot
      });
    } catch (error) {
      console.error('Update slot error:', error);
      res.status(500).json({ message: 'Error updating slot', error: error.message });
    }
  }
);

// Toggle slot status (admin only)
router.patch('/:id/status',
  [auth, adminAuth],
  async (req, res) => {
    try {
      const { status } = req.body;

      if (!['available', 'booked', 'maintenance'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const slot = await Slot.findById(req.params.id);
      if (!slot) {
        return res.status(404).json({ message: 'Slot not found' });
      }

      const oldStatus = slot.status;
      slot.status = status;
      await slot.save();

      // Update location available slots count
      const location = await Location.findById(slot.location);
      if (location) {
        if (oldStatus !== 'available' && status === 'available') {
          location.availableSlots += 1;
        } else if (oldStatus === 'available' && status !== 'available') {
          location.availableSlots -= 1;
        }
        await location.save();
      }

      res.json({
        message: 'Slot status updated successfully',
        slot
      });
    } catch (error) {
      console.error('Update slot status error:', error);
      res.status(500).json({ message: 'Error updating slot status', error: error.message });
    }
  }
);

// Delete slot (admin only)
router.delete('/:id',
  [auth, adminAuth],
  async (req, res) => {
    try {
      const slot = await Slot.findById(req.params.id);
      if (!slot) {
        return res.status(404).json({ message: 'Slot not found' });
      }

      // Check if slot is currently booked
      if (slot.status === 'booked') {
        return res.status(400).json({ message: 'Cannot delete a booked slot' });
      }

      // Soft delete
      slot.isActive = false;
      await slot.save();

      // Update location slot count
      const location = await Location.findById(slot.location);
      if (location) {
        location.totalSlots -= 1;
        if (slot.status === 'available') {
          location.availableSlots -= 1;
        }
        await location.save();
      }

      res.json({ message: 'Slot deleted successfully' });
    } catch (error) {
      console.error('Delete slot error:', error);
      res.status(500).json({ message: 'Error deleting slot', error: error.message });
    }
  }
);

module.exports = router;
