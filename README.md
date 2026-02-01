# 🅿️ ParkEase - Smart Parking Management System

A comprehensive parking management solution that helps users find and book parking spots while providing administrators with powerful management tools.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Screenshots](#screenshots)


## ✨ Features

### User Features
- 🔐 User registration and authentication
- 🗺️ Interactive map to view parking locations
- 🔍 Search and filter parking spots
- 💰 Real-time pricing information
- 📱 Responsive design for mobile and desktop

### Admin Features
- 👨‍💼 Admin dashboard with analytics
- 📍 Location management (CRUD operations)
- 💵 Dynamic pricing configuration
- 📊 Booking statistics and reports
- 🗺️ Geocoding integration for address lookup

## 🛠️ Tech Stack

### Frontend
- **React** 18.x - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Leaflet** - Interactive maps
- **React-Leaflet** - React components for Leaflet
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library

### Backend
- **Spring Boot** 3.2.1 - Java framework
- **Spring Security** - Authentication & authorization
- **Spring Data MongoDB** - Database integration
- **JWT (JJWT)** 0.11.5 - Token-based authentication
- **BCrypt** - Password encryption
- **Maven** - Build tool

### Database
- **MongoDB** - NoSQL database

### Additional Tools
- **Nominatim/OpenStreetMap** - Geocoding service
- **RestTemplate** - External API calls

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) and npm
- **Java** 17 or higher
- **Maven** 3.6+
- **MongoDB** 4.4+ (running locally or MongoDB Atlas)
- **Git**

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/parkease.git
cd parkease
```

### 2. Backend Setup

```bash
cd backend-spring

# Install dependencies (Maven will handle this)
mvn clean install
```

### 3. Frontend Setup

```bash
cd frontend-react

# Install dependencies
npm install
```

## ⚙️ Configuration

### Backend Configuration

Create/Edit `backend-spring/src/main/resources/application.properties`:

```properties
# Server Configuration
server.port=5000

# MongoDB Configuration
spring.data.mongodb.uri=mongodb://localhost:27017/parkease
# For MongoDB Atlas:
# spring.data.mongodb.uri=mongodb+srv://<username>:<password>@cluster.mongodb.net/parkease

# JWT Configuration
app.jwt.secret=myverysecuresecretkeythatisatleasttwentyfourcharacterslongforjwttoken

# Admin Registration Code
admin.registration.code=ADMIN2024
```

### Frontend Configuration

Create `frontend-react/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_MAP_CENTER_LAT=28.4595
VITE_MAP_CENTER_LNG=77.0266
```

### MongoDB Setup

#### Option 1: Local MongoDB

1. Install MongoDB Community Edition
2. Start MongoDB service:

```bash
# Windows
net start MongoDB

# macOS (Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

#### Option 2: MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string
4. Update `application.properties` with Atlas URI

## 🏃 Running the Application

### Start Backend

```bash
cd backend-spring
mvn spring-boot:run
```

Backend will run on `http://localhost:5000`

### Start Frontend

```bash
cd frontend-react
npm run dev
```

Frontend will run on `http://localhost:5173`

### Verify Installation

1. Open browser to `http://localhost:5173`
2. You should see the ParkEase homepage
3. Test API health: `http://localhost:5000/api/health`

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "password123"
}
```

#### Register Admin
```http
POST /api/auth/register/admin
Content-Type: application/json

{
  "name": "Admin User",
  "email": "admin@example.com",
  "phone": "1234567890",
  "password": "admin123",
  "adminCode": "ADMIN2024"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Location Endpoints

#### Get All Locations (Public)
```http
GET /api/locations
```

#### Get Single Location
```http
GET /api/locations/{id}
```

#### Create Location (Admin Only)
```http
POST /api/locations
Authorization: Bearer {token}
Content-Type: application/json

{
  "locationId": "LOC001",
  "name": "Downtown Parking",
  "address": "123 Main St, City",
  "latitude": 28.4595,
  "longitude": 77.0266,
  "pricing": {
    "hourly": 50,
    "daily": 400,
    "monthly": 8000
  },
  "active": true
}
```

#### Update Location (Admin Only)
```http
PUT /api/locations/{id}
Authorization: Bearer {token}
Content-Type: application/json
```

#### Delete Location (Admin Only)
```http
DELETE /api/locations/{id}
Authorization: Bearer {token}
```

### Utility Endpoints

#### Geocode Address
```http
GET /api/geocode?q=MGF Mall Gurgaon
```

#### Health Check
```http
GET /api/health
```

## 📁 Project Structure

```
parkease/
├── backend-spring/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/parkease/
│   │   │   │   ├── config/
│   │   │   │   │   └── SecurityConfig.java
│   │   │   │   ├── controllers/
│   │   │   │   │   ├── AuthController.java
│   │   │   │   │   ├── LocationController.java
│   │   │   │   │   └── GeneralController.java
│   │   │   │   ├── models/
│   │   │   │   │   ├── User.java
│   │   │   │   │   └── Location.java
│   │   │   │   ├── repository/
│   │   │   │   │   ├── UserRepository.java
│   │   │   │   │   └── LocationRepository.java
│   │   │   │   ├── security/
│   │   │   │   │   ├── JwtUtil.java
│   │   │   │   │   └── JwtFilter.java
│   │   │   │   └── ParkEaseApplication.java
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   ├── pom.xml
│   └── .gitignore
│
├── frontend-react/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Map.jsx
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── UserDashboard.jsx
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .gitignore
│
└── README.md
```

## 🔐 Default Credentials

### Admin Account
- **Email**: admin@parkease.com
- **Password**: admin123
- **Admin Code**: ADMIN2024

### Test User Account
- **Email**: user@parkease.com
- **Password**: user123

## 🐛 Troubleshooting

### Backend Issues

**MongoDB Connection Failed**
```bash
# Check if MongoDB is running
mongosh
# or
mongo --version
```

**Port 5000 Already in Use**
```bash
# Change port in application.properties
server.port=8080
```

**JWT Signature Error**
- Ensure `app.jwt.secret` is at least 32 characters
- Make sure it's the same in application.properties

### Frontend Issues

**API Connection Failed**
- Check if backend is running on port 5000
- Verify VITE_API_URL in .env file
- Check CORS configuration

**Map Not Loading**
- Check internet connection (Leaflet tiles load from OpenStreetMap)
- Verify coordinates are valid

## 📸 Screenshots

Add screenshots of your application here:

- Homepage
- Login/Register
- User Dashboard
- Admin Dashboard
- Location Map
- Booking Interface

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - [Your GitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- OpenStreetMap for map tiles
- Nominatim for geocoding services
- Spring Boot community
- React community

## 📞 Support

For support, email support@parkease.com or create an issue in the repository.

## 🗺️ Roadmap

- [ ] Payment gateway integration
- [ ] Real-time parking availability
- [ ] Mobile app (React Native)
- [ ] Email notifications
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] QR code based parking access

---

