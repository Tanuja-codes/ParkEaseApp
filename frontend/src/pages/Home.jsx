import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-3xl font-bold text-primary-600">🅿️ ParkEase</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="px-4 py-2 text-primary-600 hover:text-primary-700 font-medium"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Smart Parking Made Simple
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Find, book, and manage parking spaces with ease. Real-time availability,
            instant booking, and secure payments.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900">Find Parking</h3>
            <p className="text-gray-600">
              Search for available parking spots near your destination using our interactive map.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
            <div className="text-4xl mb-4">⏱️</div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900">Real-Time Timer</h3>
            <p className="text-gray-600">
              Track your parking duration with our built-in timer. Know exactly when to return.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
            <div className="text-4xl mb-4">💳</div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900">Easy Payment</h3>
            <p className="text-gray-600">
              Secure and hassle-free payment process. Pay only for the time you use.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust ParkEase for their parking needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/register"
              className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-lg"
            >
              Register as User
            </Link>
            <Link
              to="/admin/register"
              className="px-8 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-medium text-lg"
            >
              Register as Admin
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 font-medium text-lg"
            >
              Login
            </Link>
          </div>
        </div>
      </div>

      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; 2024 ParkEase. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
