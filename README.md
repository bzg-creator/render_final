# Weather, Movies & Quotes Web Application

A full-stack web application that combines weather information, movie searches, and movie quotes with user authentication and admin capabilities.

## Features

### Weather Dashboard
- Real-time weather information using OpenWeather API
- Interactive map display using Leaflet.js
- 14-day weather forecast
- Search weather by city name
- Detailed weather metrics including temperature, humidity, wind, etc.

### Movies Section
- Search movies using RapidAPI Movies Database
- Display movie posters, titles, release years
- Responsive movie card layout
- Real-time search functionality

### Movie Quotes
- Random Breaking Bad quotes
- Dynamic quote display
- One-click quote refresh

### Admin Panel
- User management (Create, Read, Update, Delete)
- Item management with bilingual support (English/Kazakh)
- Admin-only restricted access
- User activity logging

### Default Admin Account
- Username: `yelarys`
- Password: `admin123`

### User Registration
- Anyone can register for a basic user account
- Passwords are securely hashed using bcrypt
- Automatic login after registration

### Dependencies
```json
{
  "axios": "^1.6.2",
  "express": "^4.18.2",
  "mongoose": "^7.0.0",
  "express-session": "^1.17.3",
  "bcrypt": "^5.1.0",
  "ejs": "^3.1.9",
  "nodemon": "^3.1.9"
}