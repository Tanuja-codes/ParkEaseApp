const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const User = require('../models/User');
const Location = require('../models/Location');
const Slot = require('../models/Slot');
const { auth, adminAuth } = require('../middleware/auth');

// Get all bookings (admin only)
router.get('/bookings', [auth, adminAuth], async (req, res) => {
  try {
    const { locationId, status, startDate, endDate } = req.query;
    
    let query = {};
    if (locationId) query.location = locationId;
    if (status) query.bookingStatus = status;
    if (startDate && endDate) {
      query.bookingDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate('slot')
      .populate('location')
      .sort({ createdAt: -1 });
    
    res.json(bookings);
  } catch (error) {
    console.error('Get admin bookings error:', error);
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
});

// Get all users (admin only)
router.get('/users', [auth, adminAuth], async (req, res) => {
  try {
    const { role, isActive } = req.query;
    
    let query = {};
    if (role) query.role = role;
    if (typeof isActive !== 'undefined') query.isActive = isActive === 'true';

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Get user details with bookings (admin only)
router.get('/users/:userId', [auth, adminAuth], async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const bookings = await Booking.find({ user: req.params.userId })
      .populate('slot')
      .populate('location')
      .sort({ createdAt: -1 });

    const stats = {
      totalBookings: bookings.length,
      completedBookings: bookings.filter(b => b.bookingStatus === 'completed').length,
      cancelledBookings: bookings.filter(b => b.bookingStatus === 'cancelled').length,
      totalSpent: bookings
        .filter(b => b.paymentStatus === 'completed')
        .reduce((sum, b) => sum + b.totalAmount, 0)
    };

    res.json({
      user,
      bookings,
      stats
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ message: 'Error fetching user details', error: error.message });
  }
});

// Toggle user active status (admin only)
router.patch('/users/:userId/toggle-status', [auth, adminAuth], async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ message: 'Error toggling user status', error: error.message });
  }
});

// Delete user (admin only)
router.delete('/users/:userId', [auth, adminAuth], async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }

    // Delete all bookings associated with this user
    await Booking.deleteMany({ user: req.params.userId });

    // Delete the user
    await User.findByIdAndDelete(req.params.userId);

    res.json({
      message: 'User and associated bookings deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

// Get dashboard statistics (admin only)
router.get('/statistics/dashboard', [auth, adminAuth], async (req, res) => {
  try {
    const { locationId, period = 'daily' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
    }

    let query = {
      createdAt: { $gte: startDate },
      paymentStatus: 'completed'
    };
    
    if (locationId) {
      query.location = locationId;
    }

    const bookings = await Booking.find(query);
    
    // Calculate revenue
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.bookingStatus === 'completed').length;
    const activeBookings = bookings.filter(b => b.bookingStatus === 'active').length;
    const cancelledBookings = bookings.filter(b => b.bookingStatus === 'cancelled').length;

    // Revenue by vehicle type
    const revenueByVehicleType = {};
    bookings.forEach(booking => {
      if (!revenueByVehicleType[booking.vehicleType]) {
        revenueByVehicleType[booking.vehicleType] = 0;
      }
      revenueByVehicleType[booking.vehicleType] += booking.totalAmount;
    });

    // Get slot statistics
    let slotQuery = {};
    if (locationId) {
      slotQuery.location = locationId;
    }
    
    const totalSlots = await Slot.countDocuments({ ...slotQuery, isActive: true });
    const availableSlots = await Slot.countDocuments({ ...slotQuery, status: 'available', isActive: true });
    const bookedSlots = await Slot.countDocuments({ ...slotQuery, status: 'booked', isActive: true });

    // Average duration
    const avgDuration = bookings.length > 0
      ? bookings.reduce((sum, b) => sum + (b.duration || 0), 0) / bookings.length
      : 0;

    res.json({
      period,
      startDate,
      endDate: now,
      revenue: {
        total: totalRevenue,
        byVehicleType: revenueByVehicleType
      },
      bookings: {
        total: totalBookings,
        completed: completedBookings,
        active: activeBookings,
        cancelled: cancelledBookings
      },
      slots: {
        total: totalSlots,
        available: availableSlots,
        booked: bookedSlots,
        occupancyRate: totalSlots > 0 ? ((bookedSlots / totalSlots) * 100).toFixed(2) : 0
      },
      averageDuration: Math.round(avgDuration)
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

// Get revenue comparison (admin only)
router.get('/statistics/revenue-comparison', [auth, adminAuth], async (req, res) => {
  try {
    const { locationId } = req.query;

    const now = new Date();
    
    // Today
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));
    
    // This week
    const weekStart = new Date();
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    // This month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let baseQuery = { paymentStatus: 'completed' };
    if (locationId) baseQuery.location = locationId;

    // Daily revenue
    const dailyBookings = await Booking.find({
      ...baseQuery,
      createdAt: { $gte: todayStart, $lte: todayEnd }
    });
    const dailyRevenue = dailyBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    // Weekly revenue
    const weeklyBookings = await Booking.find({
      ...baseQuery,
      createdAt: { $gte: weekStart }
    });
    const weeklyRevenue = weeklyBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    // Monthly revenue
    const monthlyBookings = await Booking.find({
      ...baseQuery,
      createdAt: { $gte: monthStart }
    });
    const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    res.json({
      daily: {
        revenue: dailyRevenue,
        bookings: dailyBookings.length
      },
      weekly: {
        revenue: weeklyRevenue,
        bookings: weeklyBookings.length
      },
      monthly: {
        revenue: monthlyRevenue,
        bookings: monthlyBookings.length
      }
    });
  } catch (error) {
    console.error('Get revenue comparison error:', error);
    res.status(500).json({ message: 'Error fetching revenue comparison', error: error.message });
  }
});

// Get peak hours analysis (admin only)
router.get('/statistics/peak-hours', [auth, adminAuth], async (req, res) => {
  try {
    const { locationId, days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    let query = {
      createdAt: { $gte: startDate },
      bookingStatus: { $in: ['completed', 'active'] }
    };
    
    if (locationId) query.location = locationId;

    const bookings = await Booking.find(query);

    // Group by hour
    const hourlyData = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { hour: i, bookings: 0 };
    }

    bookings.forEach(booking => {
      const hour = new Date(booking.startTime).getHours();
      hourlyData[hour].bookings += 1;
    });

    const peakHours = Object.values(hourlyData).sort((a, b) => b.bookings - a.bookings);

    res.json({
      period: `Last ${days} days`,
      peakHours: peakHours.slice(0, 5),
      hourlyDistribution: Object.values(hourlyData)
    });
  } catch (error) {
    console.error('Get peak hours error:', error);
    res.status(500).json({ message: 'Error fetching peak hours', error: error.message });
  }
});

// Delete booking (admin only)
router.delete('/bookings/:bookingId', [auth, adminAuth], async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await Booking.findByIdAndDelete(req.params.bookingId);

    res.json({
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ message: 'Error deleting booking', error: error.message });
  }
});

module.exports = router;
