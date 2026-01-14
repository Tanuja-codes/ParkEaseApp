const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const Location = require('../models/Location');
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Generate unique booking ID
const generateBookingId = () => {
  return 'BK' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
};

// Create booking
router.post('/',
  [auth],
  [
    body('slotId').notEmpty().withMessage('Slot ID is required'),
    body('locationId').notEmpty().withMessage('Location ID is required'),
    body('vehicleNumber').trim().notEmpty().withMessage('Vehicle number is required'),
    body('vehicleType').isIn(['car', 'bike', 'bus', 'van', 'truck']).withMessage('Valid vehicle type is required'),
    body('bookingDate').isISO8601().withMessage('Valid booking date is required'),
    body('startTime').isISO8601().withMessage('Valid start time is required'),
    body('endTime').isISO8601().withMessage('Valid end time is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { slotId, locationId, vehicleNumber, vehicleType, bookingDate, startTime, endTime } = req.body;

      // Verify slot availability
      const slot = await Slot.findById(slotId);
      if (!slot || slot.status !== 'available') {
        return res.status(400).json({ message: 'Slot is not available' });
      }

      // Get location pricing
      const location = await Location.findById(locationId);
      if (!location) {
        return res.status(404).json({ message: 'Location not found' });
      }

      // Calculate duration and amount
      const start = new Date(startTime);
      const end = new Date(endTime);
      const duration = Math.ceil((end - start) / (1000 * 60)); // minutes
      const baseAmount = location.pricing[vehicleType] || 15;
      const intervals = Math.ceil(duration / 15); // Number of 15-minute intervals
      const totalAmount = baseAmount * intervals;

      // Create booking
      const booking = new Booking({
        bookingId: generateBookingId(),
        user: req.userId,
        slot: slotId,
        location: locationId,
        vehicleNumber: vehicleNumber.toUpperCase(),
        vehicleType,
        bookingDate: new Date(bookingDate),
        startTime: start,
        endTime: end,
        duration,
        baseAmount,
        totalAmount,
        paymentStatus: 'completed',
        paymentId: 'PAY' + Date.now(),
        bookingStatus: 'upcoming'
      });

      await booking.save();

      // Update slot status
      slot.status = 'booked';
      slot.nextAvailableTime = end;
      await slot.save();

      // Update location available slots
      location.availableSlots -= 1;
      await location.save();

      const populatedBooking = await Booking.findById(booking._id)
        .populate('slot')
        .populate('location')
        .populate('user', 'name email phone');

      res.status(201).json({
        message: 'Booking created successfully',
        booking: populatedBooking
      });
    } catch (error) {
      console.error('Create booking error:', error);
      res.status(500).json({ message: 'Error creating booking', error: error.message });
    }
  }
);

// Get user bookings
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = { user: req.userId };
    if (status) {
      query.bookingStatus = status;
    }

    const bookings = await Booking.find(query)
      .populate('slot')
      .populate('location')
      .sort({ createdAt: -1 });
    
    // Categorize bookings
    const now = new Date();
    const categorized = {
      past: [],
      current: [],
      upcoming: []
    };

    bookings.forEach(booking => {
      if (booking.bookingStatus === 'completed' || booking.bookingStatus === 'cancelled') {
        categorized.past.push(booking);
      } else if (booking.startTime <= now && booking.endTime >= now && booking.bookingStatus === 'active') {
        categorized.current.push(booking);
      } else if (booking.startTime > now && booking.bookingStatus === 'upcoming') {
        categorized.upcoming.push(booking);
      } else {
        categorized.past.push(booking);
      }
    });

    res.json(categorized);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
});

// Get single booking
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('slot')
      .populate('location')
      .populate('user', 'name email phone');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking or is admin
    if (booking.user._id.toString() !== req.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Error fetching booking', error: error.message });
  }
});

// Start timer
router.post('/:id/start-timer', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (booking.timerStarted) {
      return res.status(400).json({ message: 'Timer already started' });
    }

    const now = new Date();
    if (now < booking.startTime) {
      return res.status(400).json({ message: 'Cannot start timer before booking start time' });
    }

    booking.timerStarted = true;
    booking.actualStartTime = now;
    booking.bookingStatus = 'active';
    await booking.save();

    res.json({
      message: 'Timer started successfully',
      booking
    });
  } catch (error) {
    console.error('Start timer error:', error);
    res.status(500).json({ message: 'Error starting timer', error: error.message });
  }
});

// Stop timer and release slot
router.post('/:id/stop-timer', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('slot location');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!booking.timerStarted) {
      return res.status(400).json({ message: 'Timer not started' });
    }

    const now = new Date();
    booking.actualEndTime = now;
    booking.timerEndedAt = now;
    booking.bookingStatus = 'completed';
    
    // Calculate actual duration
    if (booking.actualStartTime) {
      booking.duration = Math.ceil((now - booking.actualStartTime) / (1000 * 60));
    }

    await booking.save();

    // Release slot
    const slot = await Slot.findById(booking.slot._id);
    if (slot) {
      slot.status = 'available';
      slot.nextAvailableTime = now;
      await slot.save();
    }

    // Update location available slots
    const location = await Location.findById(booking.location._id);
    if (location) {
      location.availableSlots += 1;
      await location.save();
    }

    res.json({
      message: 'Timer stopped and slot released successfully',
      booking
    });
  } catch (error) {
    console.error('Stop timer error:', error);
    res.status(500).json({ message: 'Error stopping timer', error: error.message });
  }
});

// Cancel booking
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id).populate('slot location');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (booking.timerStarted) {
      return res.status(400).json({ message: 'Cannot cancel booking after timer has started' });
    }

    if (['completed', 'cancelled'].includes(booking.bookingStatus)) {
      return res.status(400).json({ message: 'Booking already completed or cancelled' });
    }

    booking.bookingStatus = 'cancelled';
    booking.cancellationReason = reason || 'User cancelled';
    booking.cancelledAt = new Date();
    booking.paymentStatus = 'refunded';
    await booking.save();

    // Release slot
    const slot = await Slot.findById(booking.slot._id);
    if (slot) {
      slot.status = 'available';
      slot.nextAvailableTime = new Date();
      await slot.save();
    }

    // Update location available slots
    const location = await Location.findById(booking.location._id);
    if (location) {
      location.availableSlots += 1;
      await location.save();
    }

    res.json({
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Error cancelling booking', error: error.message });
  }
});

// Extend booking (add 15 minutes for ₹10)
router.post('/:id/extend', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('location');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!booking.timerStarted) {
      return res.status(400).json({ message: 'Timer must be started to extend booking' });
    }

    if (booking.bookingStatus === 'completed') {
      return res.status(400).json({ message: 'Cannot extend completed booking' });
    }

    // Add 15 minutes to end time
    booking.endTime = new Date(booking.endTime.getTime() + 15 * 60 * 1000);
    
    // Add ₹10 to total amount
    booking.totalAmount += 10;
    
    // Update duration
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    booking.duration = Math.ceil((end - start) / (1000 * 60));

    await booking.save();

    res.json({
      message: 'Booking extended by 15 minutes for ₹10',
      booking,
      newEndTime: booking.endTime,
      newTotalAmount: booking.totalAmount
    });
  } catch (error) {
    console.error('Extend booking error:', error);
    res.status(500).json({ message: 'Error extending booking', error: error.message });
  }
});

// Delete booking (only completed or cancelled bookings)
router.delete('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking or is admin
    if (booking.user.toString() !== req.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow deletion of completed or cancelled bookings
    if (!['completed', 'cancelled'].includes(booking.bookingStatus)) {
      return res.status(400).json({ message: 'Can only delete completed or cancelled bookings' });
    }

    await Booking.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ message: 'Error deleting booking', error: error.message });
  }
});

module.exports = router;
