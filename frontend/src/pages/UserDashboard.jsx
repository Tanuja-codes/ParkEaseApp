import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useAuth } from '../context/AuthContext';
import { locationAPI, slotAPI, bookingAPI } from '../api/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons for different states
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 25px; height: 25px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [25, 25],
    iconAnchor: [12, 12],
  });
};

const availableIcon = createCustomIcon('#10b981'); // green
const partiallyBookedIcon = createCustomIcon('#f59e0b'); // orange
const fullyBookedIcon = createCustomIcon('#ef4444'); // red

// Search marker (blue)
const searchIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #3b82f6; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 16px;">📍</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
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

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]);
  const [mapZoom, setMapZoom] = useState(13);
  const [bookingData, setBookingData] = useState({
    vehicleNumber: '',
    vehicleType: 'car',
    bookingDate: '',
    startTime: '',
    endTime: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [searchedLocation, setSearchedLocation] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showLocationList, setShowLocationList] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSlotsModal, setShowSlotsModal] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await locationAPI.getAll();
      setLocations(response.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  // Geocoding function
  const searchLocationOnMap = async () => {
    if (!locationSearch.trim()) {
      setToast('⚠️ Please enter a location to search');
      setTimeout(() => setToast(''), 3000);
      return;
    }

    setSearchLoading(true);
    setShowLocationList(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/geocode?q=${encodeURIComponent(locationSearch)}`
      );
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

        setMapCenter([lat, lon]);
        setMapZoom(16);

        const nearbyLocations = locations.filter(loc => {
          const distance = Math.sqrt(
            Math.pow(loc.latitude - lat, 2) + Math.pow(loc.longitude - lon, 2)
          );
          return distance < 0.1;
        });

        if (nearbyLocations.length === 0) {
          setToast('⚠️ No parking slots available at this location');
          setTimeout(() => setToast(''), 4000);
        } else {
          setMessage(`✅ Found ${nearbyLocations.length} parking location(s) nearby`);
          setTimeout(() => setMessage(''), 4000);
        }
      } else {
        setToast('❌ Location not found. Please try a different search term.');
        setTimeout(() => setToast(''), 3000);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setToast('❌ Error searching location. Please try again.');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleLocationSelect = async (location) => {
    setSelectedLocation(location);
    setAvailableSlots([]);
    setMapCenter([location.latitude, location.longitude]);
    setMapZoom(16);
    setMessage('');
    setShowLocationList(false);
    setShowBookingModal(true); // Open booking modal
  };

  const fetchAvailableSlots = async () => {
    if (!bookingData.startTime || !bookingData.endTime) {
      setMessage('Please select start and end time');
      return;
    }

    if (new Date(bookingData.startTime) >= new Date(bookingData.endTime)) {
      setMessage('End time must be after start time');
      return;
    }

    try {
      const response = await slotAPI.getAvailable(
        selectedLocation.id,
        bookingData.startTime,
        bookingData.endTime
      );
      setAvailableSlots(response.data);
      if (response.data.length === 0) {
        setMessage('No slots available for selected time. Please try different timing.');
      } else {
        setShowBookingModal(false);
        setShowSlotsModal(true); // Open slots modal
        setMessage('');
      }
    } catch (error) {
      console.error('Error fetching slots:', error.response?.data);
      setMessage('Error fetching slots');
    }
  };

  const calculateAmount = () => {
    if (!selectedLocation) return 0;
    const start = new Date(bookingData.startTime);
    const end = new Date(bookingData.endTime);
    const minutes = Math.ceil((end - start) / (1000 * 60));
    const intervals = Math.ceil(minutes / 15);
    return selectedLocation.pricing[bookingData.vehicleType] * intervals;
  };

  const handleBooking = async (slotId, slotStatus) => {
    if (slotStatus === 'maintenance') {
      setToast('⚠️ Slot not available for booking - Under maintenance');
      setTimeout(() => setToast(''), 3000);
      return;
    }

    if (!bookingData.vehicleNumber) {
      setMessage('Please enter vehicle number');
      return;
    }

    setLoading(true);
    try {
      await bookingAPI.create({
        slotId: slotId,
        locationId: selectedLocation.id,
        ...bookingData
      });
      setShowSlotsModal(false);
      setToast('✅ Booking successful! Redirecting to My Bookings...');
      setTimeout(() => navigate('/my-bookings'), 2000);
    } catch (error) {
      setMessage('❌ ' + (error.response?.data?.message || 'Booking failed'));
    } finally {
      setLoading(false);
    }
  };

  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMarkerIcon = (location) => {
    if (location.availableSlots === 0) return fullyBookedIcon;
    if (location.availableSlots < location.totalSlots * 0.3) return partiallyBookedIcon;
    return availableIcon;
  };

  const closeAllModals = () => {
    setShowBookingModal(false);
    setShowSlotsModal(false);
    setShowLocationList(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">🅿️ ParkEase</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Welcome, <strong>{user?.name}</strong></span>
            <button onClick={() => navigate('/my-bookings')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
              📋 My Bookings
            </button>
            <button onClick={logout}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <h2 className="text-3xl font-bold mb-6">🔍 Find Parking</h2>

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-20 right-6 z-50 px-6 py-3 rounded-lg shadow-lg ${
            toast.includes('✅') ? 'bg-green-600' : 'bg-red-600'
          } text-white`}>
            {toast}
          </div>
        )}

        {/* Search Section */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Location Search on Map */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <label className="block text-lg font-semibold mb-3">🗺️ Search Location on Map</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., Central Park, New York"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchLocationOnMap()}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={searchLocationOnMap}
                disabled={searchLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
              >
                {searchLoading ? '⏳' : '🔍'}
              </button>
            </div>
          </div>

          {/* Search Existing Locations */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <label className="block text-lg font-semibold mb-3">🅿️ Search Existing Locations</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Filter parking locations..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowLocationList(true);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={() => setShowLocationList(true)}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">🗺️ Map View</h3>

          {/* Map Legend */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-semibold mb-2">Legend:</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-green-500 mr-2 border-2 border-white shadow"></span>
                <span>Available (70%+)</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-orange-500 mr-2 border-2 border-white shadow"></span>
                <span>Filling Up (&lt;30%)</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 rounded-full bg-red-500 mr-2 border-2 border-white shadow"></span>
                <span>Full (0)</span>
              </div>
            </div>
          </div>

          <div style={{ height: '500px', borderRadius: '8px', overflow: 'hidden' }}>
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <MapController center={mapCenter} zoom={mapZoom} />

              {searchedLocation && (
                <Marker position={[searchedLocation.lat, searchedLocation.lon]} icon={searchIcon}>
                  <Popup>
                    <div className="text-sm">
                      <strong className="text-base">📍 Searched Location</strong><br />
                      <span className="text-gray-600">{searchedLocation.name}</span>
                    </div>
                  </Popup>
                </Marker>
              )}

              {locations.map(location => (
                <Marker
                  key={location.id}
                  position={[location.latitude, location.longitude]}
                  icon={getMarkerIcon(location)}
                  eventHandlers={{
                    click: () => handleLocationSelect(location)
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <strong className="text-base">{location.name}</strong><br />
                      <span className="text-gray-600">{location.address}</span><br />
                      <div className="mt-2">
                        <span className={`font-semibold ${
                          location.availableSlots === 0 ? 'text-red-600' :
                          location.availableSlots < location.totalSlots * 0.3 ? 'text-orange-600' :
                          'text-green-600'
                        }`}>
                          Available: {location.availableSlots}/{location.totalSlots}
                        </span>
                      </div>
                      <button
                        onClick={() => handleLocationSelect(location)}
                        className="mt-2 px-3 py-1 bg-primary-600 text-white rounded text-xs hover:bg-primary-700"
                      >
                        Select Location
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Location List Modal */}
      {showLocationList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
          onClick={closeAllModals}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-2xl font-bold">📍 Select Location</h3>
              <button onClick={closeAllModals} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="space-y-3">
                {filteredLocations.length > 0 ? (
                  filteredLocations.map(location => (
                    <div
                      key={location.id}
                      onClick={() => handleLocationSelect(location)}
                      className="p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md border-gray-200 hover:border-blue-400"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-lg">{location.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{location.address}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          location.availableSlots === 0 ? 'bg-red-100 text-red-700' :
                          location.availableSlots < location.totalSlots * 0.3 ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {location.availableSlots}/{location.totalSlots}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No locations found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeAllModals}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-2xl font-bold">🚗 Book Parking at {selectedLocation.name}</h3>
              <button onClick={closeAllModals} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="p-6">
              {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                  message.includes('✅') ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {message}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Vehicle Number *</label>
                  <input type="text" value={bookingData.vehicleNumber}
                    onChange={(e) => setBookingData({...bookingData, vehicleNumber: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="DL-01-AB-1234" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Vehicle Type *</label>
                  <select value={bookingData.vehicleType}
                    onChange={(e) => setBookingData({...bookingData, vehicleType: e.target.value})}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500">
                    <option value="car">🚗 Car - ₹{selectedLocation.pricing.car}/15min</option>
                    <option value="bike">🏍️ Bike - ₹{selectedLocation.pricing.bike}/15min</option>
                    <option value="bus">🚌 Bus - ₹{selectedLocation.pricing.bus}/15min</option>
                    <option value="van">🚐 Van - ₹{selectedLocation.pricing.van}/15min</option>
                    <option value="truck">🚚 Truck - ₹{selectedLocation.pricing.truck}/15min</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date *</label>
                  <input type="date" value={bookingData.bookingDate}
                    onChange={(e) => setBookingData({...bookingData, bookingDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Time *</label>
                    <input type="datetime-local" value={bookingData.startTime}
                      onChange={(e) => setBookingData({...bookingData, startTime: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">End Time *</label>
                    <input type="datetime-local" value={bookingData.endTime}
                      onChange={(e) => setBookingData({...bookingData, endTime: e.target.value})}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
                <button onClick={fetchAvailableSlots}
                  className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold text-lg">
                  🔍 Check Available Slots
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Slots Modal */}
      {showSlotsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeAllModals}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-2xl font-bold">✅ Available Slots ({availableSlots.filter(s => s.status !== 'maintenance').length})</h3>
              <button onClick={closeAllModals} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {message && (
                <div className="mb-4 p-3 rounded-lg text-sm bg-red-100 text-red-700">
                  {message}
                </div>
              )}
              <div className="space-y-3">
                {availableSlots.map(slot => (
                  <div
                    key={slot.id}
                    className={`p-4 border-2 rounded-lg ${
                      slot.status === 'maintenance'
                        ? 'border-red-500 bg-red-50'
                        : 'border-green-200 bg-green-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-lg flex items-center gap-2">
                          Slot {slot.slotNo}
                          {slot.status === 'maintenance' && (
                            <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">🔧 MAINTENANCE</span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-600">Vehicle Type: {slot.vehicleType}</p>
                        {slot.status !== 'maintenance' && (
                          <p className="text-lg font-bold text-primary-600 mt-2">
                            Total: ₹{calculateAmount()}
                          </p>
                        )}
                      </div>
                      {slot.status !== 'maintenance' && (
                        <button
                          onClick={() => handleBooking(slot.id, slot.status)}
                          disabled={loading}
                          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
                        >
                          {loading ? '⏳ Booking...' : '🎫 Book Now'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;