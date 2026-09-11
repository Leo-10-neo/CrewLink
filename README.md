# Event Management System - MERN Stack

A full-stack event management application built with MongoDB, Express, React, and Node.js featuring user authentication, event registration, and admin management capabilities.

## Features

### User Features
- User registration and login with JWT authentication
- View available events with details (title, description, date, location, capacity)
- Register for events
- Unregister from events
- View registered events in dashboard

### Admin Features
- Admin registration and login with elevated privileges
- Create, edit, and delete events
- View all events with registration statistics
- Manage users (view, delete, change roles)
- User management dashboard with role assignment

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **cors** - Cross-origin resource sharing

### Frontend
- **React** - UI library
- **React Bootstrap** - UI component library
- **React Router** - Routing
- **Axios** - HTTP client
- **Vite** - Build tool

## Project Structure

```
mern-project/
├── server/                 # Backend
│   ├── models/            # Database models
│   │   ├── User.js
│   │   └── Event.js
│   ├── routes/            # API routes
│   │   ├── auth.js
│   │   ├── events.js
│   │   └── users.js
│   ├── middleware/        # Custom middleware
│   │   └── auth.js
│   ├── .env              # Environment variables
│   ├── index.js          # Server entry point
│   └── package.json
├── src/                   # Frontend
│   ├── context/          # React context
│   │   └── AuthContext.jsx
│   ├── pages/            # Page components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── UserDashboard.jsx
│   │   └── AdminDashboard.jsx
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # React entry point
│   └── index.css
└── package.json
```

## Setup Instructions

### Prerequisites
- Node.js installed
- MongoDB installed and running
- npm or yarn package manager

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/event-management
JWT_SECRET=your_jwt_secret_key_change_this_in_production
NODE_ENV=development
```

4. Start the backend server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the project root:
```bash
cd ..
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event (admin only)
- `PUT /api/events/:id` - Update event (admin only)
- `DELETE /api/events/:id` - Delete event (admin only)
- `POST /api/events/:id/register` - Register for event (user only)
- `POST /api/events/:id/unregister` - Unregister from event (user only)

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get single user (admin only)
- `PUT /api/users/:id/role` - Update user role (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

## Usage

### Initial Setup

1. Start MongoDB service
2. Start the backend server (`cd server && npm start`)
3. Start the frontend server (`npm run dev`)

### Testing the Application

1. **Register as Admin:**
   - Go to `/register`
   - Fill in user details
   - Select "Admin" as role
   - Submit the form

2. **Create Events (as Admin):**
   - Login as admin
   - Navigate to Admin Dashboard
   - Click "Create New Event"
   - Fill in event details and submit

3. **Register as Regular User:**
   - Logout from admin account
   - Register a new user with "User" role
   - Login as the new user

4. **User Dashboard:**
   - View available events
   - Register for events
   - View registered events
   - Unregister from events

## Default Users

You'll need to create users through the registration interface:
- **Admin User:** Register with role "admin" for full system access
- **Regular User:** Register with role "user" for event registration

## Security Notes

- Change the `JWT_SECRET` in the `.env` file for production
- Use environment variables for sensitive data
- Implement rate limiting for production
- Add input validation and sanitization
- Use HTTPS in production
- Implement proper error handling

## Development

### Backend Development
```bash
cd server
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development
```bash
npm run dev  # Uses Vite for hot module replacement
```

## Future Enhancements

- Email notifications for event updates
- Event categories and filtering
- Search functionality
- Event images and media
- User profiles
- Payment integration for paid events
- Calendar integration
- Mobile app version
- Advanced analytics dashboard

## License

This project is open source and available for educational purposes.