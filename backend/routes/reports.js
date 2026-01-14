const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Location = require('../models/Location');
const Slot = require('../models/Slot');
const { auth, adminAuth } = require('../middleware/auth');

// Helper function to convert JSON to CSV
const jsonToCSV = (data, headers) => {
  if (!data || data.length === 0) return '';
  
  const csv = [];
  csv.push(headers.join(','));
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    });
    csv.push(values.join(','));
  });
  
  return csv.join('\n');
};

// Generate monthly usage report (admin only)
router.get('/monthly-usage', [auth, adminAuth], async (req, res) => {
  try {
    const { locationId, year, month } = req.query;

    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) - 1 : new Date().getMonth();

    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    let query = {
      bookingDate: { $gte: startDate, $lte: endDate }
    };
    
    if (locationId) {
      query.location = locationId;
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email')
      .populate('location', 'name locationId')
      .populate('slot', 'slotNo');

    // Calculate metrics
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.bookingStatus === 'completed').length;
    const totalRevenue = bookings
      .filter(b => b.paymentStatus === 'completed')
      .reduce((sum, b) => sum + b.totalAmount, 0);
    
    const avgDuration = bookings.length > 0
      ? bookings.reduce((sum, b) => sum + (b.duration || 0), 0) / bookings.length
      : 0;

    // Peak hours
    const hourlyBookings = {};
    bookings.forEach(booking => {
      const hour = new Date(booking.startTime).getHours();
      hourlyBookings[hour] = (hourlyBookings[hour] || 0) + 1;
    });
    
    const peakHour = Object.entries(hourlyBookings)
      .sort(([, a], [, b]) => b - a)[0];

    // Booking by day
    const dailyBookings = {};
    bookings.forEach(booking => {
      const day = new Date(booking.bookingDate).getDate();
      dailyBookings[day] = (dailyBookings[day] || 0) + 1;
    });

    // User type segmentation
    const userTypes = {
      newUsers: 0,
      returningUsers: 0
    };

    const userBookingCounts = {};
    bookings.forEach(booking => {
      const userId = booking.user._id.toString();
      userBookingCounts[userId] = (userBookingCounts[userId] || 0) + 1;
    });

    Object.values(userBookingCounts).forEach(count => {
      if (count === 1) userTypes.newUsers++;
      else userTypes.returningUsers++;
    });

    res.json({
      period: {
        month: currentMonth + 1,
        year: currentYear,
        startDate,
        endDate
      },
      summary: {
        totalBookings,
        completedBookings,
        totalRevenue,
        averageDuration: Math.round(avgDuration),
        peakHour: peakHour ? `${peakHour[0]}:00` : 'N/A'
      },
      dailyBookings,
      userSegmentation: userTypes,
      bookings: bookings.map(b => ({
        bookingId: b.bookingId,
        user: b.user.name,
        location: b.location.name,
        slot: b.slot.slotNo,
        vehicleType: b.vehicleType,
        date: b.bookingDate,
        duration: b.duration,
        amount: b.totalAmount,
        status: b.bookingStatus
      }))
    });
  } catch (error) {
    console.error('Generate monthly report error:', error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
});

// Export bookings to CSV (admin only)
router.get('/export/bookings', [auth, adminAuth], async (req, res) => {
  try {
    const { locationId, startDate, endDate, slotId, status } = req.query;

    let query = {};
    
    if (locationId) query.location = locationId;
    if (slotId) query.slot = slotId;
    if (status) query.bookingStatus = status;
    
    if (startDate && endDate) {
      query.bookingDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate('location', 'name locationId')
      .populate('slot', 'slotNo')
      .sort({ createdAt: -1 });

    // Prepare data for CSV
    const csvData = bookings.map(booking => ({
      'Booking ID': booking.bookingId,
      'User Name': booking.user.name,
      'User Email': booking.user.email,
      'User Phone': booking.user.phone,
      'Location': booking.location.name,
      'Location ID': booking.location.locationId,
      'Slot Number': booking.slot.slotNo,
      'Vehicle Number': booking.vehicleNumber,
      'Vehicle Type': booking.vehicleType,
      'Booking Date': new Date(booking.bookingDate).toLocaleDateString(),
      'Start Time': new Date(booking.startTime).toLocaleString(),
      'End Time': new Date(booking.endTime).toLocaleString(),
      'Duration (minutes)': booking.duration,
      'Amount': booking.totalAmount,
      'Payment Status': booking.paymentStatus,
      'Booking Status': booking.bookingStatus,
      'Created At': new Date(booking.createdAt).toLocaleString()
    }));

    const headers = [
      'Booking ID', 'User Name', 'User Email', 'User Phone',
      'Location', 'Location ID', 'Slot Number',
      'Vehicle Number', 'Vehicle Type', 'Booking Date',
      'Start Time', 'End Time', 'Duration (minutes)',
      'Amount', 'Payment Status', 'Booking Status', 'Created At'
    ];

    const csv = jsonToCSV(csvData, headers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=bookings-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export bookings error:', error);
    res.status(500).json({ message: 'Error exporting bookings', error: error.message });
  }
});

// Export slot usage to CSV (admin only)
router.get('/export/slot-usage', [auth, adminAuth], async (req, res) => {
  try {
    const { locationId, startDate, endDate } = req.query;

    let query = {};
    if (locationId) query.location = locationId;
    
    if (startDate && endDate) {
      query.bookingDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const bookings = await Booking.find(query)
      .populate('slot', 'slotNo')
      .populate('location', 'name locationId');

    // Calculate slot usage
    const slotUsage = {};
    
    bookings.forEach(booking => {
      const slotKey = `${booking.location.locationId}-${booking.slot.slotNo}`;
      if (!slotUsage[slotKey]) {
        slotUsage[slotKey] = {
          locationId: booking.location.locationId,
          locationName: booking.location.name,
          slotNo: booking.slot.slotNo,
          totalBookings: 0,
          totalDuration: 0,
          totalRevenue: 0
        };
      }
      
      slotUsage[slotKey].totalBookings += 1;
      slotUsage[slotKey].totalDuration += booking.duration || 0;
      if (booking.paymentStatus === 'completed') {
        slotUsage[slotKey].totalRevenue += booking.totalAmount;
      }
    });

    const csvData = Object.values(slotUsage).map(slot => ({
      'Location ID': slot.locationId,
      'Location Name': slot.locationName,
      'Slot Number': slot.slotNo,
      'Total Bookings': slot.totalBookings,
      'Total Duration (minutes)': slot.totalDuration,
      'Average Duration (minutes)': Math.round(slot.totalDuration / slot.totalBookings),
      'Total Revenue': slot.totalRevenue,
      'Average Revenue': Math.round(slot.totalRevenue / slot.totalBookings)
    }));

    const headers = [
      'Location ID', 'Location Name', 'Slot Number',
      'Total Bookings', 'Total Duration (minutes)', 'Average Duration (minutes)',
      'Total Revenue', 'Average Revenue'
    ];

    const csv = jsonToCSV(csvData, headers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=slot-usage-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export slot usage error:', error);
    res.status(500).json({ message: 'Error exporting slot usage', error: error.message });
  }
});

// Export revenue report to CSV (admin only)
router.get('/export/revenue', [auth, adminAuth], async (req, res) => {
  try {
    const { locationId, startDate, endDate, groupBy = 'daily' } = req.query;

    let query = { paymentStatus: 'completed' };
    if (locationId) query.location = locationId;
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const bookings = await Booking.find(query)
      .populate('location', 'name locationId');

    // Group revenue
    const revenueData = {};
    
    bookings.forEach(booking => {
      let dateKey;
      const date = new Date(booking.createdAt);
      
      if (groupBy === 'daily') {
        dateKey = date.toISOString().split('T')[0];
      } else if (groupBy === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        dateKey = weekStart.toISOString().split('T')[0];
      } else if (groupBy === 'monthly') {
        dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!revenueData[dateKey]) {
        revenueData[dateKey] = {
          date: dateKey,
          totalRevenue: 0,
          totalBookings: 0,
          car: 0,
          bike: 0,
          bus: 0,
          van: 0,
          truck: 0
        };
      }
      
      revenueData[dateKey].totalRevenue += booking.totalAmount;
      revenueData[dateKey].totalBookings += 1;
      revenueData[dateKey][booking.vehicleType] += booking.totalAmount;
    });

    const csvData = Object.values(revenueData).map(data => ({
      'Date': data.date,
      'Total Revenue': data.totalRevenue,
      'Total Bookings': data.totalBookings,
      'Car Revenue': data.car,
      'Bike Revenue': data.bike,
      'Bus Revenue': data.bus,
      'Van Revenue': data.van,
      'Truck Revenue': data.truck,
      'Average Revenue': Math.round(data.totalRevenue / data.totalBookings)
    }));

    const headers = [
      'Date', 'Total Revenue', 'Total Bookings',
      'Car Revenue', 'Bike Revenue', 'Bus Revenue', 'Van Revenue', 'Truck Revenue',
      'Average Revenue'
    ];

    const csv = jsonToCSV(csvData, headers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=revenue-report-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export revenue report error:', error);
    res.status(500).json({ message: 'Error exporting revenue report', error: error.message });
  }
});

module.exports = router;
