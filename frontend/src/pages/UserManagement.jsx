import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../api/api';
import { format } from 'date-fns';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await adminAPI.getUsers({ role: 'user' });
      setUsers(res.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      const res = await adminAPI.getUserDetails(userId);
      setUserDetails(res.data);
      setSelectedUser(userId);
    } catch (error) {
      alert('Error fetching user details');
    }
  };

  const handleToggleUserStatus = async (userId) => {
    if (window.confirm('Are you sure you want to toggle this user\'s active status?')) {
      try {
        await adminAPI.toggleUserStatus(userId);
        alert('✅ User status updated successfully');
        fetchUsers();
        if (selectedUser === userId) {
          fetchUserDetails(userId);
        }
      } catch (error) {
        alert('❌ Error updating user status');
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('⚠️ Are you sure you want to DELETE this user? This will:\n- Delete the user account\n- Remove all their bookings\n- This action CANNOT be undone!')) {
      try {
        await adminAPI.deleteUser(userId);
        alert('✅ User deleted successfully');
        setSelectedUser(null);
        setUserDetails(null);
        fetchUsers();
      } catch (error) {
        alert('❌ ' + (error.response?.data?.message || 'Error deleting user'));
      }
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to delete this booking record?')) {
      try {
        await adminAPI.deleteBooking(bookingId);
        alert('✅ Booking deleted successfully');
        fetchUserDetails(selectedUser);
      } catch (error) {
        alert('❌ Error deleting booking');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-900 text-white px-6 py-4">
        <div className="container mx-auto flex justify-between">
          <h1 className="text-2xl font-bold">User Management</h1>
          <button onClick={() => navigate('/admin/dashboard')} className="px-4 py-2 border rounded">Back</button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-4">All Users</h2>
            <div className="space-y-2">
              {users.map(user => (
                <div key={user._id}
                  onClick={() => fetchUserDetails(user._id)}
                  className={`p-4 border rounded-lg cursor-pointer hover:bg-blue-50 ${
                    selectedUser === user._id ? 'bg-blue-100 border-blue-500' : ''
                  }`}>
                  <h3 className="font-bold">{user.name}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-600">{user.phone}</p>
                  <p className={`text-sm mt-1 ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {userDetails && (
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold mb-4">User Details</h2>
              <div className="mb-6">
                <h3 className="text-xl font-bold">{userDetails.user.name}</h3>
                <p className="text-gray-600">{userDetails.user.email}</p>
                <p className="text-gray-600">{userDetails.user.phone}</p>
                <p className={`mt-2 text-sm font-semibold ${userDetails.user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  Status: {userDetails.user.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mb-6 flex gap-3">
                <button 
                  onClick={() => handleToggleUserStatus(userDetails.user._id)}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold ${
                    userDetails.user.isActive 
                      ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {userDetails.user.isActive ? '🚫 Deactivate User' : '✅ Activate User'}
                </button>
                <button 
                  onClick={() => handleDeleteUser(userDetails.user._id)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                >
                  🗑️ Delete User
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded">
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold">{userDetails.stats.totalBookings}</p>
                </div>
                <div className="p-4 bg-green-50 rounded">
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">{userDetails.stats.completedBookings}</p>
                </div>
                <div className="p-4 bg-red-50 rounded">
                  <p className="text-sm text-gray-600">Cancelled</p>
                  <p className="text-2xl font-bold">{userDetails.stats.cancelledBookings}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded">
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold">₹{userDetails.stats.totalSpent}</p>
                </div>
              </div>

              <h3 className="text-lg font-bold mb-3">Recent Bookings</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {userDetails.bookings.slice(0, 10).map(booking => (
                  <div key={booking._id} className="p-3 border rounded hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">#{booking.bookingId}</p>
                        <p className="text-sm">{booking.location?.name}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(booking.bookingDate), 'PPP')} - ₹{booking.totalAmount}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          booking.bookingStatus === 'completed' ? 'bg-green-100 text-green-700' : 
                          booking.bookingStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {booking.bookingStatus}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteBooking(booking._id)}
                        className="ml-2 px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                        title="Delete Booking"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
