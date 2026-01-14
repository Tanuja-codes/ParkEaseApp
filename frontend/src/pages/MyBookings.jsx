import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingAPI } from '../api/api';
import { format } from 'date-fns';

const Timer = ({ booking, onStop, onExtend }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (booking.timerStarted) {
      const interval = setInterval(() => {
        const start = new Date(booking.actualStartTime);
        const now = new Date();
        setElapsed(Math.floor((now - start) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [booking]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-green-50 p-4 rounded-lg border-2 border-green-500">
      <div className="text-3xl font-mono font-bold text-green-700 text-center timer-pulse">
        {formatTime(elapsed)}
      </div>
      <div className="mt-3 space-y-2">
        <button onClick={onStop}
          className="w-full py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold">
          🛑 Stop Timer & Release Slot
        </button>
        <button onClick={onExtend}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold">
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
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await bookingAPI.getMyBookings();
      setBookings(response.data);
    } catch (error) {
      console.error('Error:', error);
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
      alert('Timer stopped and slot released!');
      fetchBookings();
    } catch (error) {
      alert('Error stopping timer');
    }
  };

  const handleCancel = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await bookingAPI.cancel(bookingId, 'Cancelled by user');
        alert('Booking cancelled successfully');
        fetchBookings();
      } catch (error) {
        alert(error.response?.data?.message || 'Error cancelling');
      }
    }
  };

  const handleDelete = async (bookingId) => {
    if (window.confirm('Are you sure you want to delete this booking record? This action cannot be undone.')) {
      try {
        // Note: You'll need to add this endpoint in the backend
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

  const BookingCard = ({ booking, type }) => {
    const now = new Date();
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);
    const canStartTimer = now >= startTime && now <= endTime && !booking.timerStarted;
    
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold">#{booking.bookingId}</h3>
            <p className="text-gray-600">{booking.location?.name}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            booking.bookingStatus === 'completed' ? 'bg-green-100 text-green-800' :
            booking.bookingStatus === 'active' ? 'bg-blue-100 text-blue-800' :
            booking.bookingStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {booking.bookingStatus.toUpperCase()}
          </span>
        </div>
        <div className="space-y-2 mb-4">
          <p><strong>Slot:</strong> {booking.slot?.slotNo}</p>
          <p><strong>Vehicle:</strong> {booking.vehicleNumber} ({booking.vehicleType})</p>
          <p><strong>Date:</strong> {format(new Date(booking.bookingDate), 'PPP')}</p>
          <p><strong>Time:</strong> {format(new Date(booking.startTime), 'p')} - {format(new Date(booking.endTime), 'p')}</p>
          <p><strong>Amount:</strong> ₹{booking.totalAmount}</p>
          {booking.duration > 0 && (
            <p><strong>Duration:</strong> {booking.duration} minutes</p>
          )}
        </div>
        
        {/* Show Start Timer button for current bookings */}
        {(type === 'current' || type === 'upcoming') && !booking.timerStarted && canStartTimer && (
          <div className="space-y-2">
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-2">
              <p className="text-sm text-yellow-800 font-medium">✓ Your booking time has started! You can now start the timer.</p>
            </div>
            <button onClick={() => handleStartTimer(booking._id)}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-lg">
              🚗 Start Timer
            </button>
          </div>
        )}
        
        {/* Show timer is not yet started message */}
        {(type === 'current' || type === 'upcoming') && !booking.timerStarted && !canStartTimer && now < startTime && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <p className="text-sm text-blue-800">⏰ Timer will be available at start time: {format(startTime, 'p')}</p>
          </div>
        )}
        
        {/* Show active timer */}
        {booking.timerStarted && !booking.timerEndedAt && (
          <Timer booking={booking} onStop={() => handleStopTimer(booking._id)} onExtend={() => handleExtend(booking._id)} />
        )}
        
        {/* Cancel button for upcoming bookings */}
        {type === 'upcoming' && !booking.timerStarted && now < startTime && (
          <button onClick={() => handleCancel(booking._id)}
            className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold mt-2">
            ❌ Cancel Booking
          </button>
        )}
        
        {/* Delete button for past or cancelled bookings */}
        {type === 'past' && (booking.bookingStatus === 'completed' || booking.bookingStatus === 'cancelled') && (
          <button onClick={() => handleDelete(booking._id)}
            className="w-full py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold mt-2">
            🗑️ Delete Booking
          </button>
        )}
      </div>
    );
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">My Bookings</h1>
          <div className="space-x-4">
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 border rounded-lg">Dashboard</button>
            <button onClick={logout} className="px-4 py-2 border rounded-lg">Logout</button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">Current Bookings</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookings.current.length > 0 ? bookings.current.map(b => (
                <BookingCard key={b._id} booking={b} type="current" />
              )) : <p className="text-gray-500">No current bookings</p>}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Upcoming Bookings</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookings.upcoming.length > 0 ? bookings.upcoming.map(b => (
                <BookingCard key={b._id} booking={b} type="upcoming" />
              )) : <p className="text-gray-500">No upcoming bookings</p>}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Past Bookings</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookings.past.length > 0 ? bookings.past.map(b => (
                <BookingCard key={b._id} booking={b} type="past" />
              )) : <p className="text-gray-500">No past bookings</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MyBookings;
