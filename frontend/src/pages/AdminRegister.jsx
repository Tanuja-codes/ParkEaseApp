import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/api';

const AdminRegister = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', adminCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authAPI.registerAdmin(formData);
      login(response.data.user, response.data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Admin Registration</h2>
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Full Name" required
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg" />
          <input type="email" placeholder="Email" required
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg" />
          <input type="tel" placeholder="Phone" required
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg" />
          <input type="password" placeholder="Password" required minLength="6"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg" />
          <input type="text" placeholder="Admin Code" required
            onChange={(e) => setFormData({...formData, adminCode: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg" />
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900">
            {loading ? 'Creating...' : 'Register as Admin'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link to="/login" className="text-blue-600">Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default AdminRegister;
