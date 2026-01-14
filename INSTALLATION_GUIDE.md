# ParkEase - Complete Installation Guide

## 📋 Prerequisites
- Node.js v18+ installed
- MongoDB v6+ installed and running
- npm or yarn package manager
- Basic knowledge of terminal/command line

## 🚀 Quick Start Guide

### Step 1: Install MongoDB
```bash
# For Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y mongodb

# For Mac (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community

# For Windows
# Download from https://www.mongodb.com/try/download/community
```

### Step 2: Start MongoDB
```bash
# Ubuntu/Debian
sudo systemctl start mongod
sudo systemctl enable mongod

# Mac
brew services start mongodb-community

# Windows
# MongoDB will start automatically after installation
```

### Step 3: Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# The .env file is already configured with default values
# For production, change JWT_SECRET in .env file

# Start the backend server
npm run dev

# Backend will run on http://localhost:5000
```

### Step 4: Frontend Setup (Open new terminal)
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev

# Frontend will run on http://localhost:5173
```

### Step 5: Access the Application
- Open browser and go to http://localhost:5173
- You should see the ParkEase home page

## 👥 Default Users

### Register New User
1. Click "Register as User"
2. Fill in your details
3. Login and access user dashboard

### Register New Admin
1. Click "Register as Admin"
2. Fill in details
3. Use admin code: **ADMIN2024**
4. Login to access admin dashboard

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### MongoDB Connection Error
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

### Module Not Found Errors
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

## 📱 Features to Test

### As User:
1. Browse locations on map
2. Select a location and view available slots
3. Book a parking slot
4. View bookings (past, current, upcoming)
5. Start timer when parking
6. Stop timer to release slot
7. Cancel upcoming bookings

### As Admin:
1. Create parking locations
2. Add parking slots to locations
3. View all bookings and users
4. Manage slot availability
5. View performance statistics
6. Export reports (CSV)
7. Set pricing for different vehicle types

## 🎯 Testing Workflow

1. **Setup**: Register one admin and one user account
2. **Admin**: Create a location (e.g., "City Mall Parking")
3. **Admin**: Add 5-10 parking slots to the location
4. **User**: Login and view the location on map
5. **User**: Book a parking slot
6. **User**: Go to "My Bookings" and start the timer
7. **Admin**: View booking in admin dashboard
8. **User**: Stop timer and complete parking
9. **Admin**: View statistics and export reports

## 📊 API Testing with Postman

Import these endpoints into Postman:

### Auth
- POST http://localhost:5000/api/auth/register
- POST http://localhost:5000/api/auth/login

### Locations
- GET http://localhost:5000/api/locations
- POST http://localhost:5000/api/locations (admin only)

### Bookings
- POST http://localhost:5000/api/bookings
- GET http://localhost:5000/api/bookings/my-bookings

## 🐛 Common Issues

1. **White screen on frontend**: Check browser console for errors
2. **API not responding**: Verify backend is running on port 5000
3. **Map not loading**: Check internet connection (tiles from CDN)
4. **Authentication errors**: Clear browser localStorage and login again

## 📞 Support

For issues or questions:
- Check console logs in browser (F12)
- Check terminal logs for backend errors
- Verify all dependencies are installed
- Ensure MongoDB is running

## 🎉 Success Checklist

- [ ] MongoDB installed and running
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 5173
- [ ] Can access homepage at localhost:5173
- [ ] Can register and login
- [ ] Can view locations on map
- [ ] Can create bookings
- [ ] Timer functionality works
- [ ] Admin can manage slots
- [ ] Can export reports

---

**Made with ❤️ for Milestone 3**
