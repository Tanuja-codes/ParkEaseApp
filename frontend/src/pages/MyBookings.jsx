import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingAPI } from '../api/api';
import { format } from 'date-fns';

const Timer = ({ booking, onStop, onExtend }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (booking.timerStarted && !booking.timerEndedAt) {
      const interval = setInterval(() => {
        const start = new Date(booking.actualStartTime);
        const now = new Date();
        const totalSeconds = Math.floor((now - start) / 1000);
        setElapsed(totalSeconds);

        // Auto-stop when booking end time is reached
        const endTime = new Date(booking.endTime);
        if (now >= endTime) {
          clearInterval(interval);
          onStop();
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [booking, onStop]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-green-50 p-4 rounded-lg border-2 border-green-500">
      <div className="text-center mb-2">
        <p className="text-sm font-semibold text-gray-600">Parking Duration</p>
      </div>
      <div className="text-3xl font-mono font-bold text-green-700 text-center">
        {formatTime(elapsed)}
      </div>
      <div className="mt-3 space-y-2">
        <button onClick={onStop}
          className="w-full py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold transition-colors">
          🛑 Stop Timer & Release Slot
        </button>
        <button onClick={onExtend}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold transition-colors">
          ⏱️ Extend 15 min (+₹10)
        </button>
      </div>
    </div>
  );
};

const MyBookings = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState({ past: [], current: [], upcoming: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
    // Refresh bookings every 30 seconds to update statuses
    const interval = setInterval(fetchBookings, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await bookingAPI.getMyBookings();
      console.log('Bookings response:', response.data);

      // Get current time
      const now = new Date();

      // Manually re-categorize all bookings based on actual time
      const allBookings = [
        ...(response.data.past || []),
        ...(response.data.current || []),
        ...(response.data.upcoming || [])
      ];

      const categorized = {
        past: [],
        current: [],
        upcoming: []
      };

      allBookings.forEach(booking => {
        const startTime = new Date(booking.startTime);
        const endTime = new Date(booking.endTime);

        // Past: Completed, Cancelled, or ended bookings
        if (booking.bookingStatus === 'completed' || booking.bookingStatus === 'cancelled') {
          categorized.past.push(booking);
        }
        // Past: Bookings where end time has passed but not completed
        else if (endTime < now && booking.bookingStatus !== 'active') {
          categorized.past.push(booking);
        }
        // Current: Active bookings OR bookings within their time window
        else if (booking.bookingStatus === 'active' || (startTime <= now && now <= endTime)) {
          categorized.current.push(booking);
        }
        // Upcoming: Future bookings
        else if (startTime > now) {
          categorized.upcoming.push(booking);
        }
        // Default: put in past
        else {
          categorized.past.push(booking);
        }
      });

      setBookings(categorized);
    } catch (error) {
      console.error('Error details:', error.response?.data);
      console.error('Full error:', error);
      alert('Error loading bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTimer = async (bookingId) => {
    try {
      await bookingAPI.startTimer(bookingId);
      fetchBookings();
    } catch (error) {
      alert(error.response?.data?.message || 'Error starting timer');
    }
  };

  const handleStopTimer = async (bookingId) => {
    try {
      await bookingAPI.stopTimer(bookingId);
      alert('✅ Timer stopped and slot released!');
      fetchBookings();
    } catch (error) {
      alert('❌ Error stopping timer');
    }
  };

  const handleCancel = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await bookingAPI.cancel(bookingId, 'Cancelled by user');
        alert('✅ Booking cancelled successfully');
        fetchBookings();
      } catch (error) {
        alert('❌ ' + (error.response?.data?.message || 'Error cancelling'));
      }
    }
  };

  const handleDelete = async (bookingId) => {
    if (window.confirm('Are you sure you want to delete this booking record? This action cannot be undone.')) {
      try {
        await bookingAPI.delete(bookingId);
        alert('✅ Booking deleted successfully');
        fetchBookings();
      } catch (error) {
        alert('❌ ' + (error.response?.data?.message || 'Error deleting booking'));
      }
    }
  };

  const handleExtend = async (bookingId) => {
    if (window.confirm('Extend booking by 15 minutes for ₹10?')) {
      try {
        await bookingAPI.extend(bookingId);
        alert('✅ Booking extended by 15 minutes!');
        fetchBookings();
      } catch (error) {
        alert('❌ ' + (error.response?.data?.message || 'Error extending booking'));
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: 'bg-green-500 text-white',
      active: 'bg-blue-500 text-white',
      upcoming: 'bg-orange-500 text-white',
      cancelled: 'bg-red-500 text-white'
    };
    return badges[status] || 'bg-gray-500 text-white';
  };

  const BookingCard = ({ booking, type }) => {
    const now = new Date();
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);

    // Can only start timer if:
    // 1. Current time is >= start time AND <= end time
    // 2. Timer hasn't been started yet
    // 3. Booking is not completed or cancelled
    const canStartTimer =
      now >= startTime &&
      now <= endTime &&
      !booking.timerStarted &&
      booking.bookingStatus !== 'completed' &&
      booking.bookingStatus !== 'cancelled';

    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-200 hover:shadow-xl transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800">{booking.location?.name || 'Unknown Location'}</h3>
            <p className="text-xs text-gray-500 mt-1">Booking ID: {booking.bookingId}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(booking.bookingStatus)}`}>
            {booking.bookingStatus === 'upcoming' ? '⏰ UPCOMING' :
             booking.bookingStatus === 'active' ? '🔄 ACTIVE' :
             booking.bookingStatus === 'completed' ? '✅ COMPLETED' :
             booking.bookingStatus === 'cancelled' ? '❌ CANCELLED' :
             '📋 ' + booking.bookingStatus.toUpperCase()}
          </span>
        </div>

        <div className="space-y-2 mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Slot:</span>
            <span className="font-semibold">{booking.slot?.slotNo || booking.slotNo || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Vehicle:</span>
            <span className="font-semibold">{booking.vehicleNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Type:</span>
            <span className="font-semibold capitalize">{booking.vehicleType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date:</span>
            <span className="font-semibold">{format(new Date(booking.bookingDate), 'MMM dd, yyyy')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Time:</span>
            <span className="font-semibold">{format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="text-gray-600">Amount:</span>
            <span className="font-bold text-green-600 text-lg">₹{booking.totalAmount}</span>
          </div>
          {booking.duration > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-semibold">{booking.duration} min</span>
            </div>
          )}
        </div>

        {/* Show Start Timer button ONLY when booking time has started */}
        {canStartTimer && (
          <div className="space-y-2">
            <div className="bg-yellow-50 border border-yellow-300 p-3 rounded-lg mb-2">
              <p className="text-sm text-yellow-800 font-medium">
                ✓ Your booking time has started! Click below to start the timer.
              </p>
            </div>
            <button onClick={() => handleStartTimer(booking._id)}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-base shadow-md hover:shadow-lg transition-all">
              🚗 Start Parking Timer
            </button>
          </div>
        )}

        {/* Show waiting message for upcoming bookings */}
        {type === 'upcoming' && !booking.timerStarted && now < startTime && (
          <div className="bg-blue-50 border border-blue-300 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              ⏰ Booking starts at: <strong>{format(startTime, 'HH:mm, MMM dd')}</strong>
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Timer will be available when booking time begins
            </p>
          </div>
        )}

        {/* Show active timer */}
        {booking.timerStarted && !booking.timerEndedAt && (
          <Timer
            booking={booking}
            onStop={() => handleStopTimer(booking._id)}
            onExtend={() => handleExtend(booking._id)}
          />
        )}

        {/* Cancel button for upcoming bookings */}
        {type === 'upcoming' && !booking.timerStarted && now < startTime && (
          <button onClick={() => handleCancel(booking._id)}
            className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold mt-2 transition-colors">
            ❌ Cancel Booking
          </button>
        )}

        {/* Delete button for past or cancelled bookings */}
        {type === 'past' && (booking.bookingStatus === 'completed' || booking.bookingStatus === 'cancelled') && (
          <button onClick={() => handleDelete(booking._id)}
            className="w-full py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold mt-2 transition-colors">
            🗑️ Delete Booking
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">📋 My Bookings</h1>
          <div className="space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              🏠 Dashboard
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Active Bookings */}
          <section>
            <div className="flex items-center mb-4">
              <h2 className="text-2xl font-bold">🔄 Active Bookings</h2>
              <span className="ml-3 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {bookings.current.length}
              </span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookings.current.length > 0 ? bookings.current.map(b => (
                <BookingCard key={b._id} booking={b} type="current" />
              )) : (
                <div className="col-span-full bg-white rounded-xl p-12 text-center shadow-lg">
                  <p className="text-gray-500 text-lg">No active bookings</p>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
                    Book a Slot
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Upcoming Bookings */}
          <section>
            <div className="flex items-center mb-4">
              <h2 className="text-2xl font-bold">⏰ Upcoming Bookings</h2>
              <span className="ml-3 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {bookings.upcoming.length}
              </span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookings.upcoming.length > 0 ? bookings.upcoming.map(b => (
                <BookingCard key={b._id} booking={b} type="upcoming" />
              )) : (
                <div className="col-span-full bg-white rounded-xl p-12 text-center shadow-lg">
                  <p className="text-gray-500 text-lg">No upcoming bookings</p>
                </div>
              )}
            </div>
          </section>

          {/* Past Bookings */}
          <section>
            <div className="flex items-center mb-4">
              <h2 className="text-2xl font-bold">📜 Past Bookings</h2>
              <span className="ml-3 bg-gray-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {bookings.past.length}
              </span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookings.past.length > 0 ? bookings.past.map(b => (
                <BookingCard key={b._id} booking={b} type="past" />
              )) : (
                <div className="col-span-full bg-white rounded-xl p-12 text-center shadow-lg">
                  <p className="text-gray-500 text-lg">No past bookings</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MyBookings;