import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useAuth } from '../context/AuthContext';
import { locationAPI } from '../api/api';
import L from 'leaflet';

// Custom marker icons
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">P</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

const locationIcon = createCustomIcon('#3b82f6'); // blue

// Search marker
const searchIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #ef4444; width: 35px; height: 35px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; font-weight: bold;">📍</div>`,
  iconSize: [35, 35],
  iconAnchor: [17, 17],
});

// Component to handle map flying to location
const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1 });
    }
  }, [center, zoom, map]);
  return null;
};

const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]);
  const [mapZoom, setMapZoom] = useState(13);
  const [formData, setFormData] = useState({
    locationId: '', name: '', address: '', latitude: '', longitude: ''
  });
  const [error, setError] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [searchedLocation, setSearchedLocation] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await locationAPI.getAll();
      setLocations(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Geocoding function
  const searchLocationOnMap = async () => {
    if (!locationSearch.trim()) {
      setError('⚠️ Please enter a location to search');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setSearchLoading(true);
    setError('');
    
    try {
    const response = await fetch(
      `http://localhost:5000/api/geocode?q=${encodeURIComponent(locationSearch)}`);

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        
        setSearchedLocation({
          name: result.display_name,
          lat,
          lon
        });
        
        // Auto-fill form fields
        setFormData({
          ...formData,
          name: locationSearch,
          address: result.display_name,
          latitude: lat.toString(),
          longitude: lon.toString()
        });
        
        setMapCenter([lat, lon]);
        setMapZoom(16);
        
        setError('✅ Location found! Fields auto-filled. Add Location ID to save.');
        setTimeout(() => setError(''), 5000);
      } else {
        setError('❌ Location not found. Please try a different search term.');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setError('❌ Error searching location. Please try again.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await locationAPI.create({
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      });
      alert('✅ Location created successfully');
      setShowAddForm(false);
      setFormData({ locationId: '', name: '', address: '', latitude: '', longitude: '' });
      fetchLocations();
    } catch (error) {
      setError(error.response?.data?.message || 'Error creating location');
    }
  };

  const handleLocationClick = (location) => {
    setMapCenter([location.latitude, location.longitude]);
    setMapZoom(16);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-900 text-white">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">🅿️ Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/admin/slots')} 
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 font-medium">
              🎯 Slots
            </button>
            <button onClick={() => navigate('/admin/performance')} 
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 font-medium">
              📊 Performance
            </button>
            <button onClick={() => navigate('/admin/users')} 
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 font-medium">
              👥 Users
            </button>
            <button onClick={logout} 
              className="px-4 py-2 border border-white rounded hover:bg-gray-800 font-medium">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">📍 Parking Locations</h2>
          <button onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
            {showAddForm ? '❌ Cancel' : '➕ Add Location'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {showAddForm && (
          <div className="bg-white p-6 rounded-xl shadow-lg mb-6 border-2 border-blue-200">
            <h3 className="text-xl font-bold mb-4">Create New Location</h3>
            
            {/* Location Search */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <label className="block text-sm font-semibold mb-2">🗺️ Search Location on Map (Optional)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., Times Square, New York or any address"
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchLocationOnMap()}
                  className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={searchLocationOnMap}
                  disabled={searchLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
                >
                  {searchLoading ? '⏳ Searching...' : '🔍 Search'}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                💡 Search to auto-fill name, address, and coordinates
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Location ID *</label>
                <input placeholder="e.g., LOC001" value={formData.locationId}
                  onChange={(e) => setFormData({...formData, locationId: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <input placeholder="e.g., City Mall Parking" value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Address *</label>
                <input placeholder="e.g., 123 Main Street, City" value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Latitude * (Auto-filled)</label>
                <input placeholder="Auto-filled from search" type="number" step="any" value={formData.latitude}
                  onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Longitude * (Auto-filled)</label>
                <input placeholder="Auto-filled from search" type="number" step="any" value={formData.longitude}
                  onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50" required />
              </div>
              <div className="md:col-span-2">
                <button type="submit" 
                  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-lg">
                  ✅ Create Location
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Locations List */}
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">All Locations ({locations.length})</h3>
              {locations.length > 0 ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {locations.map(loc => (
                    <div key={loc._id} 
                      onClick={() => handleLocationClick(loc)}
                      className="p-4 border-2 rounded-lg hover:shadow-md transition-all cursor-pointer hover:border-blue-400 bg-white">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg">{loc.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{loc.address}</p>
                          <p className="text-xs text-gray-500 mt-1">ID: {loc.locationId}</p>
                        </div>
                        <div className="text-right ml-4">
                          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            loc.availableSlots === 0 ? 'bg-red-100 text-red-700' :
                            loc.availableSlots < loc.totalSlots * 0.3 ? 'bg-orange-100 text-orange-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {loc.availableSlots}/{loc.totalSlots}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-sm">
                        <span className="text-gray-600">
                          <strong>Total Slots:</strong> {loc.totalSlots}
                        </span>
                        <span className={loc.availableSlots > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {loc.availableSlots > 0 ? '✓ Available' : '✗ Full'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-4xl mb-3">📍</p>
                  <p>No locations added yet</p>
                  <p className="text-sm mt-2">Click "Add Location" to create your first parking location</p>
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">🗺️ Map View</h3>
            
            {/* Map Legend */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-semibold mb-2">Legend:</p>
              <div className="flex items-center text-sm">
                <span className="w-6 h-6 rounded-full bg-blue-500 mr-2 border-2 border-white shadow flex items-center justify-center text-white font-bold text-xs">P</span>
                <span>Parking Locations</span>
              </div>
              <p className="text-xs text-gray-600 mt-2">Click on a location card to zoom to its position on the map</p>
            </div>

            <div style={{height: '500px', borderRadius: '8px', overflow: 'hidden'}}>
              <MapContainer 
                center={mapCenter} 
                zoom={mapZoom} 
                style={{height: '100%', width: '100%'}}
              >
                <TileLayer 
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <MapController center={mapCenter} zoom={mapZoom} />
                
                {/* Searched location marker */}
                {searchedLocation && (
                  <Marker position={[searchedLocation.lat, searchedLocation.lon]} icon={searchIcon}>
                    <Popup>
                      <div className="text-sm">
                        <strong className="text-base text-red-600">📍 Searched Location</strong><br />
                        <span className="text-gray-600">{searchedLocation.name}</span><br />
                        <div className="mt-2 text-xs">
                          <p><strong>Lat:</strong> {searchedLocation.lat.toFixed(6)}</p>
                          <p><strong>Lon:</strong> {searchedLocation.lon.toFixed(6)}</p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )}
                
                {/* Existing parking locations */}
                {locations.map(loc => (
                  <Marker key={loc._id} position={[loc.latitude, loc.longitude]} icon={locationIcon}>
                    <Popup>
                      <div className="text-sm">
                        <strong className="text-base">{loc.name}</strong><br />
                        <span className="text-gray-600">{loc.address}</span><br />
                        <div className="mt-2 pt-2 border-t">
                          <p><strong>ID:</strong> {loc.locationId}</p>
                          <p><strong>Total Slots:</strong> {loc.totalSlots}</p>
                          <p className={`font-semibold ${
                            loc.availableSlots === 0 ? 'text-red-600' :
                            loc.availableSlots < loc.totalSlots * 0.3 ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                            <strong>Available:</strong> {loc.availableSlots}/{loc.totalSlots}
                          </p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {locations.length > 0 && (
          <div className="mt-8 grid md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
              <h4 className="text-gray-600 text-sm mb-2">Total Locations</h4>
              <p className="text-3xl font-bold text-blue-600">{locations.length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500">
              <h4 className="text-gray-600 text-sm mb-2">Total Slots</h4>
              <p className="text-3xl font-bold text-green-600">
                {locations.reduce((sum, loc) => sum + loc.totalSlots, 0)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-yellow-500">
              <h4 className="text-gray-600 text-sm mb-2">Available Slots</h4>
              <p className="text-3xl font-bold text-yellow-600">
                {locations.reduce((sum, loc) => sum + loc.availableSlots, 0)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-red-500">
              <h4 className="text-gray-600 text-sm mb-2">Occupied Slots</h4>
              <p className="text-3xl font-bold text-red-600">
                {locations.reduce((sum, loc) => sum + (loc.totalSlots - loc.availableSlots), 0)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
