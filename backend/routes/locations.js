const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const { auth, adminAuth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all locations (public)
router.get('/', async (req, res) => {
  try {
    const locations = await Location.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(locations);
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ message: 'Error fetching locations', error: error.message });
  }
});

// Get single location
router.get('/:id', async (req, res) => {
  try {
    const location = await Location.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    
    res.json(location);
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({ message: 'Error fetching location', error: error.message });
  }
});

// Create location (admin only)
router.post('/',
  [auth, adminAuth],
  [
    body('locationId').trim().notEmpty().withMessage('Location ID is required'),
    body('name').trim().notEmpty().withMessage('Location name is required'),
    body('address').trim().notEmpty().withMessage('Address is required'),
    body('latitude').isFloat().withMessage('Valid latitude is required'),
    body('longitude').isFloat().withMessage('Valid longitude is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { locationId, name, address, latitude, longitude, pricing } = req.body;

      // Check if location ID already exists
      const existingLocation = await Location.findOne({ locationId });
      if (existingLocation) {
        return res.status(400).json({ message: 'Location ID already exists' });
      }

      const location = new Location({
        locationId,
        name,
        address,
        latitude,
        longitude,
        pricing: pricing || {},
        createdBy: req.userId
      });

      await location.save();

      res.status(201).json({
        message: 'Location created successfully',
        location
      });
    } catch (error) {
      console.error('Create location error:', error);
      res.status(500).json({ message: 'Error creating location', error: error.message });
    }
  }
);

// Update location (admin only)
router.put('/:id',
  [auth, adminAuth],
  async (req, res) => {
    try {
      const { name, address, latitude, longitude, pricing, isActive } = req.body;

      const location = await Location.findById(req.params.id);
      if (!location) {
        return res.status(404).json({ message: 'Location not found' });
      }

      if (name) location.name = name;
      if (address) location.address = address;
      if (latitude) location.latitude = latitude;
      if (longitude) location.longitude = longitude;
      if (pricing) location.pricing = { ...location.pricing, ...pricing };
      if (typeof isActive === 'boolean') location.isActive = isActive;

      await location.save();

      res.json({
        message: 'Location updated successfully',
        location
      });
    } catch (error) {
      console.error('Update location error:', error);
      res.status(500).json({ message: 'Error updating location', error: error.message });
    }
  }
);

// Update pricing (admin only)
router.patch('/:id/pricing',
  [auth, adminAuth],
  async (req, res) => {
    try {
      const { pricing } = req.body;

      if (!pricing) {
        return res.status(400).json({ message: 'Pricing data is required' });
      }

      const location = await Location.findById(req.params.id);
      if (!location) {
        return res.status(404).json({ message: 'Location not found' });
      }

      location.pricing = { ...location.pricing, ...pricing };
      await location.save();

      res.json({
        message: 'Pricing updated successfully',
        location
      });
    } catch (error) {
      console.error('Update pricing error:', error);
      res.status(500).json({ message: 'Error updating pricing', error: error.message });
    }
  }
);

// Delete location (admin only)
router.delete('/:id',
  [auth, adminAuth],
  async (req, res) => {
    try {
      const location = await Location.findById(req.params.id);
      if (!location) {
        return res.status(404).json({ message: 'Location not found' });
      }

      // Soft delete
      location.isActive = false;
      await location.save();

      res.json({ message: 'Location deleted successfully' });
    } catch (error) {
      console.error('Delete location error:', error);
      res.status(500).json({ message: 'Error deleting location', error: error.message });
    }
  }
);

module.exports = router;
