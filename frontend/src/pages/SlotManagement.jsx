import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { locationAPI, slotAPI } from '../api/api';

const SlotManagement = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [slots, setSlots] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    slotNo: '', latitude: '', longitude: '', vehicleType: 'car'
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    const res = await locationAPI.getAll();
    setLocations(res.data);
  };

  const fetchSlots = async (locationId) => {
    const res = await slotAPI.getByLocation(locationId);
    setSlots(res.data);
  };

  const handleLocationChange = (e) => {
    const loc = locations.find(l => l.id === e.target.value);

    setSelectedLocation(loc);
    fetchSlots(e.target.value);

      if (loc) {
          fetchSlots(loc.id);
    setFormData({
      ...formData,
      latitude: loc.latitude.toString(),
      longitude: loc.longitude.toString(),
    });
  }

  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    try {
      await slotAPI.create({
        ...formData,
        location: selectedLocation.id,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      });
      alert('Slot added successfully');
      setShowAddForm(false);
      fetchSlots(selectedLocation.id);
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding slot');
    }
  };

  const toggleSlotStatus = async (slotId, currentStatus) => {
    const newStatus = currentStatus === 'available' ? 'booked' : 'available';
    try {
      await slotAPI.toggleStatus(slotId, newStatus);
      fetchSlots(selectedLocation.id);
    } catch (error) {
      alert('Error toggling status');
    }
  };

   const toggleMaintenanceStatus = async (slotId, currentStatus) => {
    const newStatus = currentStatus === 'available' ? 'booked' : 'available';
    try {
      await slotAPI.toggleStatus(slotId, newStatus);
      fetchSlots(selectedLocation.id);
    } catch (error) {
      alert('Error toggling status');
    }
  };

  const deleteSlot = async (slotId) => {
    if (window.confirm('Delete this slot?')) {
      try {
        await slotAPI.delete(slotId);
        fetchSlots(selectedLocation.id);
      } catch (error) {
        alert('Error deleting slot');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-900 text-white px-6 py-4">
        <div className="container mx-auto flex justify-between">
          <h1 className="text-2xl font-bold">Slot Management</h1>
          <button onClick={() => navigate('/admin/dashboard')}
            className="px-4 py-2 border rounded">Back</button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <label className="block text-lg font-bold mb-2">Select Location</label>
          <select onChange={handleLocationChange}
            className="w-full px-4 py-2 border rounded-lg"
            value={selectedLocation?.id || ''}>
            <option value="">Choose a location</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>

        {selectedLocation && (
          <>
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-bold">Slots for {selectedLocation.name}</h2>
              <button onClick={() => setShowAddForm(!showAddForm)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg">
                {showAddForm ? 'Cancel' : 'Add Slot'}
              </button>
            </div>

            {showAddForm && (
              <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
                <form onSubmit={handleAddSlot} className="space-y-4">
                  <input placeholder="Slot Number" value={formData.slotNo}
                    onChange={(e) => setFormData({...formData, slotNo: e.target.value})}
                    className="w-full px-4 py-2 border rounded" required />
                  <input placeholder="Latitude" type="number" step="any" value={formData.latitude}
                    // onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                   readOnly
                   className="w-full px-4 py-2 border rounded" required />
                  <input placeholder="Longitude" type="number" step="any" value={formData.longitude}
                    // onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                   readOnly
                   className="w-full px-4 py-2 border rounded" required />
                  <select value={formData.vehicleType}
                    onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                    className="w-full px-4 py-2 border rounded">
                     <option value="all">All</option>
                    <option value="car">Car</option>
                    <option value="bike">Bike</option>
                    <option value="bus">Bus</option>
                    <option value="van">Van</option>
                    <option value="truck">Truck</option>
                  </select>
                  <button type="submit" className="w-full py-2 bg-green-600 text-white rounded">Add Slot</button>
                </form>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              {slots.map(slot => (
                <div key={slot.id} className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-bold text-lg">Slot {slot.slotNo}</h3>
                  <p className="text-sm text-gray-600">Type: {slot.vehicleType}</p>
                  <p className={`text-sm mt-2 ${slot.status === 'available' ? 'text-green-600' : 'text-red-600'}`}>
                    Status: {slot.status}
                  </p>
                  <div className="mt-4 space-x-2">
                    <button onClick={() => toggleSlotStatus(slot.id, slot.status)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Toggle</button>
                      <button onClick={() => toggleMaintenanceStatus(slot.id, slot.status)}
                      className="px-3 py-1 bg-yellow-600 text-white rounded text-sm">Maintenance</button>
                    <button onClick={() => deleteSlot(slot.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SlotManagement;
