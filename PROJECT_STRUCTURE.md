# ParkEase Project Structure

## Complete File Tree

```
parkease-app/
├── README.md                          # Main documentation
├── INSTALLATION_GUIDE.md              # Detailed setup instructions
├── PROJECT_STRUCTURE.md               # This file
│
├── backend/                           # Node.js Express Backend
│   ├── middleware/
│   │   └── auth.js                    # JWT authentication middleware
│   ├── models/
│   │   ├── User.js                    # User schema (users & admins)
│   │   ├── Location.js                # Parking location schema
│   │   ├── Slot.js                    # Parking slot schema
│   │   └── Booking.js                 # Booking schema with timer
│   ├── routes/
│   │   ├── auth.js                    # Authentication routes
│   │   ├── locations.js               # Location CRUD operations
│   │   ├── slots.js                   # Slot management
│   │   ├── bookings.js                # Booking with timer functionality
│   │   ├── admin.js                   # Admin statistics & management
│   │   └── reports.js                 # CSV export functionality
│   ├── .env                           # Environment variables (configured)
│   ├── .env.example                   # Environment template
│   ├── .gitignore                     # Git ignore rules
│   ├── package.json                   # Backend dependencies
│   └── server.js                      # Express server entry point
│
└── frontend/                          # React Vite Frontend
    ├── public/                        # Static assets
    ├── src/
    │   ├── api/
    │   │   └── api.js                 # Axios API configuration with JWT
    │   ├── context/
    │   │   └── AuthContext.jsx        # Authentication state management
    │   ├── pages/
    │   │   ├── Home.jsx               # Landing page
    │   │   ├── Login.jsx              # User/Admin login
    │   │   ├── Register.jsx           # User registration
    │   │   ├── AdminRegister.jsx      # Admin registration
    │   │   ├── UserDashboard.jsx      # User dashboard with map & booking
    │   │   ├── MyBookings.jsx         # Bookings with timer functionality
    │   │   ├── AdminDashboard.jsx     # Admin dashboard with location mgmt
    │   │   ├── SlotManagement.jsx     # Add/edit/delete slots
    │   │   ├── Performance.jsx        # Statistics & analytics with charts
    │   │   └── UserManagement.jsx     # User details & booking history
    │   ├── App.jsx                    # Main app component with routing
    │   ├── main.jsx                   # React entry point
    │   └── index.css                  # Global styles with Tailwind
    ├── .env                           # Frontend environment (configured)
    ├── .gitignore                     # Git ignore rules
    ├── index.html                     # HTML entry point
    ├── package.json                   # Frontend dependencies
    ├── vite.config.js                 # Vite configuration
    ├── tailwind.config.js             # Tailwind CSS configuration
    └── postcss.config.js              # PostCSS configuration
```

## Key Technologies

### Backend
- **Express.js**: Web framework
- **MongoDB & Mongoose**: Database
- **JWT (jsonwebtoken)**: Authentication
- **bcryptjs**: Password hashing
- **CORS**: Cross-origin support
- **dotenv**: Environment management
- **express-validator**: Input validation

### Frontend
- **React 18**: UI library
- **Vite**: Build tool
- **React Router DOM**: Navigation
- **Axios**: HTTP client
- **Leaflet & React-Leaflet**: Interactive maps
- **Recharts**: Data visualization
- **Tailwind CSS**: Styling
- **date-fns**: Date formatting

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/register/admin` - Admin registration (code: ADMIN2024)
- `POST /api/auth/login` - Login

### Locations
- `GET /api/locations` - Get all locations
- `POST /api/locations` - Create location (admin)
- `PUT /api/locations/:id` - Update location (admin)
- `PATCH /api/locations/:id/pricing` - Update pricing (admin)

### Slots
- `GET /api/slots/location/:id` - Get slots for location
- `GET /api/slots/location/:id/available` - Get available slots
- `POST /api/slots` - Create slot (admin)
- `PATCH /api/slots/:id/status` - Toggle status (admin)
- `DELETE /api/slots/:id` - Delete slot (admin)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my-bookings` - Get user bookings
- `POST /api/bookings/:id/start-timer` - Start parking timer
- `POST /api/bookings/:id/stop-timer` - Stop timer & release slot
- `POST /api/bookings/:id/cancel` - Cancel booking

### Admin
- `GET /api/admin/bookings` - All bookings
- `GET /api/admin/users` - All users
- `GET /api/admin/statistics/dashboard` - Dashboard stats
- `GET /api/admin/statistics/revenue-comparison` - Revenue comparison
- `GET /api/admin/statistics/peak-hours` - Peak hours analysis

### Reports
- `GET /api/reports/monthly-usage` - Monthly report
- `GET /api/reports/export/bookings` - Export bookings CSV
- `GET /api/reports/export/slot-usage` - Export slot usage CSV
- `GET /api/reports/export/revenue` - Export revenue CSV

## Database Schema

### User
- name, email, password (hashed), phone, role (user/admin), isActive

### Location
- locationId, name, address, latitude, longitude, totalSlots, availableSlots, pricing{car, bike, bus, van, truck}, createdBy

### Slot
- slotNo, location (ref), latitude, longitude, status (available/booked/maintenance), vehicleType, nextAvailableTime

### Booking
- bookingId, user (ref), slot (ref), location (ref), vehicleNumber, vehicleType, bookingDate, startTime, endTime, actualStartTime, actualEndTime, duration, baseAmount, totalAmount, paymentStatus, bookingStatus, timerStarted, timerEndedAt

## Milestone 3 Features Implementation

✅ **Parking Timer Functionality**
- Real-time countdown timer
- Start/stop timer controls
- Automatic slot release on stop
- Visual timer display with pulse animation

✅ **Payment Simulation**
- Dynamic price calculation based on duration
- Vehicle type-based pricing
- Cost summary display before booking
- Dummy payment gateway (auto-approved)

✅ **Slot Management Panel**
- Add new slots with coordinates
- Edit slot details
- Delete slots (with validation)
- Toggle availability status
- Location-based slot filtering

✅ **Booking Overview**
- Current, past, and upcoming bookings
- Detailed timestamps
- User and admin views
- Filtering and sorting options

✅ **Monthly Usage Reports**
- Total bookings count
- Peak hours identification
- Average duration calculation
- User type segmentation
- Daily/weekly breakdown

✅ **Export Functionality**
- CSV format exports
- Bookings export with all details
- Slot usage statistics export
- Revenue reports export
- Date range filtering
- Compatible with Excel/Sheets

## Security Features

- JWT-based authentication with 7-day expiration
- Password hashing with bcryptjs (10 salt rounds)
- Protected routes (middleware validation)
- Role-based access control (user/admin)
- CORS configuration for frontend
- Input validation on all endpoints
- HTTP-only considerations for production

## Development Commands

### Backend
```bash
cd backend
npm install          # Install dependencies
npm run dev          # Start with nodemon
npm start            # Production start
```

### Frontend
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
```

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/parkease
JWT_SECRET=parkease_secret_key_2024_change_in_production
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## Production Deployment Notes

1. Change JWT_SECRET to a strong random string
2. Set NODE_ENV=production
3. Update MONGODB_URI to production database
4. Update FRONTEND_URL to production domain
5. Build frontend: `npm run build`
6. Serve frontend build folder
7. Use process manager (PM2) for backend
8. Set up reverse proxy (nginx)
9. Enable HTTPS
10. Configure MongoDB authentication

---

**Project Status**: ✅ Complete and Ready for Deployment
**Milestone**: 3
**Features**: All milestone objectives implemented
