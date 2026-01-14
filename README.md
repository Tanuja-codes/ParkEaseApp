# 🅿️ ParkEase - Smart Parking Management System

A comprehensive MERN stack application for managing parking spaces with real-time booking, timer functionality, and admin analytics.

## 🌟 Features

### User Features
- 🔐 Secure user authentication with JWT
- 🗺️ Interactive map to search parking locations (Leaflet integration)
- 📅 Real-time slot booking with date and time selection
- ⏱️ Live parking timer with start/stop functionality
- 💳 Dummy payment gateway simulation
- 📊 Booking history (past, current, upcoming)
- ❌ Cancel bookings before timer starts
- 🚗 Support for multiple vehicle types (car, bike, bus, van, truck)

### Admin Features
- 📍 Create and manage parking locations
- 🎯 Add, update, delete parking slots
- 🔄 Toggle slot status (available/booked/maintenance)
- 📈 Performance statistics and revenue analytics
- 💰 Set pricing based on vehicle type and location
- 📊 Daily, weekly, and monthly revenue comparison
- 👥 User management with booking details
- 📥 Export reports in CSV format
- ⏰ Peak hours analysis
- 📑 Monthly usage reports

## 🛠️ Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- CORS enabled
- dotenv for environment variables

### Frontend
- React 18
- Vite for fast development
- React Router DOM for navigation
- Axios for API calls
- Leaflet & React-Leaflet for maps
- Recharts for data visualization
- Tailwind CSS for styling
- date-fns for date handling

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd parkease-app
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your configurations:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/parkease
# JWT_SECRET=your_secret_key_here
# NODE_ENV=development
# FRONTEND_URL=http://localhost:5173

# Start MongoDB (if not running)
# mongod

# Start backend server
npm run dev
```

The backend will run on http://localhost:5000

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create .env file (optional)
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Start frontend development server
npm run dev
```

The frontend will run on http://localhost:5173

## 📱 Usage

### For Users
1. Go to http://localhost:5173
2. Click "Register as User"
3. Fill in your details and create an account
4. Login with your credentials
5. Browse the map to find parking locations
6. Select a location and view available slots
7. Book a slot by providing:
   - Vehicle number
   - Vehicle type
   - Date and time
8. Complete dummy payment
9. Start timer when you arrive
10. Stop timer when leaving
11. View booking history in "My Bookings"

### For Admins
1. Register as admin (admin code: ADMIN2024)
2. Login to admin dashboard
3. Create parking locations with coordinates
4. Add parking slots for each location
5. Manage slot availability
6. View performance statistics
7. Set pricing for different vehicle types
8. Monitor user activity and bookings
9. Export reports as CSV

## 🗂️ Project Structure

```
parkease-app/
├── backend/
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Location.js
│   │   ├── Slot.js
│   │   └── Booking.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── locations.js
│   │   ├── slots.js
│   │   ├── bookings.js
│   │   ├── admin.js
│   │   └── reports.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── api.js
│   │   ├── components/
│   │   │   ├── MapComponent.jsx
│   │   │   ├── Timer.jsx
│   │   │   ├── BookingModal.jsx
│   │   │   └── Navbar.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── AdminRegister.jsx
│   │   │   ├── UserDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── MyBookings.jsx
│   │   │   ├── SlotManagement.jsx
│   │   │   ├── Performance.jsx
│   │   │   └── UserManagement.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/register/admin` - Admin registration
- `POST /api/auth/login` - User/Admin login

### Locations
- `GET /api/locations` - Get all locations
- `POST /api/locations` - Create location (admin)
- `PUT /api/locations/:id` - Update location (admin)
- `PATCH /api/locations/:id/pricing` - Update pricing (admin)
- `DELETE /api/locations/:id` - Delete location (admin)

### Slots
- `GET /api/slots/location/:locationId` - Get slots by location
- `GET /api/slots/location/:locationId/available` - Get available slots
- `POST /api/slots` - Create slot (admin)
- `PUT /api/slots/:id` - Update slot (admin)
- `PATCH /api/slots/:id/status` - Toggle slot status (admin)
- `DELETE /api/slots/:id` - Delete slot (admin)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my-bookings` - Get user bookings
- `POST /api/bookings/:id/start-timer` - Start parking timer
- `POST /api/bookings/:id/stop-timer` - Stop timer and release slot
- `POST /api/bookings/:id/cancel` - Cancel booking

### Admin
- `GET /api/admin/bookings` - Get all bookings
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:userId` - Get user details
- `GET /api/admin/statistics/dashboard` - Dashboard statistics
- `GET /api/admin/statistics/revenue-comparison` - Revenue comparison
- `GET /api/admin/statistics/peak-hours` - Peak hours analysis

### Reports
- `GET /api/reports/monthly-usage` - Monthly usage report
- `GET /api/reports/export/bookings` - Export bookings CSV
- `GET /api/reports/export/slot-usage` - Export slot usage CSV
- `GET /api/reports/export/revenue` - Export revenue CSV

## 🎯 Milestone 3 Features Implemented

✅ **Parking Timer Functionality**
- Real-time timer tracking for each booking
- Start timer when vehicle enters slot
- Stop timer on checkout with automatic slot release

✅ **Payment Simulation**
- Calculate fees based on duration and vehicle type
- Display cost summary before payment
- Dummy payment gateway integration

✅ **Slot Management Panel**
- Add new slots with location and ID
- Edit or remove slots
- Toggle slot availability status

✅ **Booking Overview**
- View current and past bookings with timestamps
- Basic statistics for slot occupancy
- Usage trend analysis

✅ **Monthly Usage Reports**
- Detailed reports on parking slot utilization
- Metrics: total bookings, peak hours, average duration
- Segmentation by day, week, and user type

✅ **Export Functionality**
- CSV format export support
- Filter and export data by date range or slot ID
- Compatible with spreadsheet applications

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Protected routes (frontend & backend)
- Role-based access control
- CORS configuration
- Input validation

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Make sure MongoDB is running
sudo systemctl start mongod

# Or start MongoDB manually
mongod --dbpath /path/to/data/directory
```

### Port Already in Use
```bash
# Find and kill process using port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in .env file
PORT=5001
```

### Leaflet Map Not Loading
- Ensure you have internet connection (Leaflet tiles need CDN)
- Check browser console for errors
- Verify Leaflet CSS is loaded in index.html

## 📄 License

This project is created for educational purposes.

## 👥 Admin Code

To register as an admin, use the code: **ADMIN2024**

## 🤝 Support

For issues or questions, please open an issue in the repository.

---

**Made with ❤️ for Milestone 3 - ParkEase**
