import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { adminAPI, locationAPI, reportsAPI } from '../api/api';

const Performance = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('all'); // Changed from '' to 'all'
  const [stats, setStats] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [peakHours, setPeakHours] = useState(null);
  const [period, setPeriod] = useState('daily');
  const [showPricing, setShowPricing] = useState(false);
  const [pricing, setPricing] = useState({
    car: 15, bike: 10, bus: 25, van: 20, truck: 22
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (locations.length > 0) {
      fetchData();
    }
  }, [selectedLocation, period, locations]);

  const fetchLocations = async () => {
    try {
      const response = await locationAPI.getAll();
      setLocations(response.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchData = async () => {
    try {
      // If "all" is selected, pass null or undefined to backend
      const locationParam = selectedLocation === 'all' ? null : selectedLocation;

      const [statsRes, compRes, peakRes] = await Promise.all([
        adminAPI.getDashboardStats({ locationId: locationParam, period }),
        adminAPI.getRevenueComparison({ locationId: locationParam }),
        adminAPI.getPeakHours({ locationId: locationParam, days: 7 })
      ]);

      setStats(statsRes.data);
      setComparison(compRes.data);
      setPeakHours(peakRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading statistics. Please check console for details.');
    }
  };

  const handleUpdatePricing = async () => {
    if (!selectedLocation || selectedLocation === 'all') {
      alert('Please select a specific location to update pricing');
      return;
    }
    try {
      await locationAPI.updatePricing(selectedLocation, pricing);
      alert('✅ Pricing updated successfully');
      setShowPricing(false);
    } catch (error) {
      alert('❌ Error updating pricing');
    }
  };

  const downloadReport = async (type) => {
    try {
      const locationParam = selectedLocation === 'all' ? null : selectedLocation;
      const response = await reportsAPI[`export${type}`]({ locationId: locationParam });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type.toLowerCase()}-report-${Date.now()}.csv`;
      link.click();
    } catch (error) {
      alert('❌ Error downloading report');
    }
  };

  const downloadPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-900 text-white px-6 py-4 no-print">
        <div className="container mx-auto flex justify-between">
          <h1 className="text-2xl font-bold">📊 Performance & Statistics</h1>
          <button onClick={() => navigate('/admin/dashboard')} className="px-4 py-2 border rounded">Back</button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-4 py-2 border rounded-lg no-print">
            <option value="all">All Locations</option>
            {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
          </select>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border rounded-lg no-print">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* PDF Download Button */}
        <div className="mb-6 no-print">
          <button onClick={downloadPDF}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">
            📄 Download Statistics as PDF
          </button>
        </div>

        {stats && (
          <>
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-gray-600 text-sm">Total Revenue</h3>
                <p className="text-3xl font-bold text-green-600">₹{stats.revenue.total}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-gray-600 text-sm">Total Bookings</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.bookings.total}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-gray-600 text-sm">Occupancy Rate</h3>
                <p className="text-3xl font-bold text-purple-600">{stats.slots.occupancyRate}%</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-gray-600 text-sm">Avg Duration</h3>
                <p className="text-3xl font-bold text-orange-600">{stats.averageDuration} min</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold mb-4">Revenue by Vehicle Type</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(stats.revenue.byVehicleType).map(([k, v]) => ({name: k, revenue: v}))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3b82f6" name="Revenue (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {comparison && (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-xl font-bold mb-4">Revenue Comparison</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      {name: 'Daily', revenue: comparison.daily.revenue, bookings: comparison.daily.bookings},
                      {name: 'Weekly', revenue: comparison.weekly.revenue, bookings: comparison.weekly.bookings},
                      {name: 'Monthly', revenue: comparison.monthly.revenue, bookings: comparison.monthly.bookings}
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="revenue" fill="#10b981" name="Revenue (₹)" />
                      <Bar dataKey="bookings" fill="#f59e0b" name="Bookings" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Peak Hours Chart */}
            {peakHours && (
              <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                <h3 className="text-xl font-bold mb-4">📊 Peak Hours Analysis (Last 7 Days)</h3>
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Top 5 Peak Hours: {peakHours.peakHours.slice(0, 5).map(h => `${h.hour}:00 (${h.bookings} bookings)`).join(', ')}
                  </p>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={peakHours.hourlyDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Number of Bookings', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="bookings" stroke="#8b5cf6" strokeWidth={2} name="Bookings" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Pricing Management (per 15 minutes)</h3>
                <button onClick={() => setShowPricing(!showPricing)}
                  className="px-4 py-2 bg-blue-600 text-white rounded no-print"
                  disabled={selectedLocation === 'all'}>
                  {showPricing ? 'Cancel' : 'Set Prices'}
                </button>
              </div>
              {selectedLocation === 'all' && (
                <p className="text-sm text-gray-600 mb-4">Select a specific location to update pricing</p>
              )}
              {showPricing && selectedLocation !== 'all' && (
                <div className="grid md:grid-cols-5 gap-4 no-print">
                  {Object.keys(pricing).map(type => (
                    <div key={type}>
                      <label className="block text-sm mb-1 capitalize">{type}</label>
                      <input type="number" value={pricing[type]}
                        onChange={(e) => setPricing({...pricing, [type]: Number(e.target.value)})}
                        className="w-full px-3 py-2 border rounded" />
                    </div>
                  ))}
                  <div className="flex items-end">
                    <button onClick={handleUpdatePricing}
                      className="w-full py-2 bg-green-600 text-white rounded">Update</button>
                  </div>
                </div>
              )}
              {!showPricing && (
                <div className="grid md:grid-cols-5 gap-4 text-sm">
                  {Object.entries(pricing).map(([type, price]) => (
                    <div key={type} className="p-3 bg-gray-50 rounded">
                      <p className="font-semibold capitalize">{type}</p>
                      <p className="text-lg text-blue-600">₹{price}/15min</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold mb-4">Export Reports</h3>
              <div className="flex space-x-4 no-print">
                <button onClick={() => downloadReport('Bookings')}
                  className="px-6 py-2 bg-blue-600 text-white rounded">📊 Export Bookings</button>
                <button onClick={() => downloadReport('SlotUsage')}
                  className="px-6 py-2 bg-green-600 text-white rounded">🎯 Export Slot Usage</button>
                <button onClick={() => downloadReport('Revenue')}
                  className="px-6 py-2 bg-purple-600 text-white rounded">💰 Export Revenue</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Performance;