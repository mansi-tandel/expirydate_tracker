# Expiry Date Tracker

A full-stack MERN application for tracking expiry dates of various items with user authentication and reminder functionality.

## Features

- 🔐 **User Authentication**: Signup and login with JWT tokens
- 📦 **Reminder Management**: Create, read, update, and delete reminders
- 🎯 **Expiry Tracking**: Track expiry dates with visual status indicators
- 🔔 **Notification Settings**: Configure multiple reminder days
- 🖼️ **Image Support**: Add images to reminders (URL-based)
- 📱 **Responsive Design**: Modern UI that works on all devices

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB Atlas** - Cloud database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **CSS3** - Styling with modern design

## Project Structure

```
expiry-date-tracker/
├── server.js                 # Main server file
├── config.env               # Environment variables
├── package.json             # Backend dependencies
├── models/
│   ├── User.js             # User model
│   └── Reminder.js         # Reminder model
├── routes/
│   ├── auth.js             # Authentication routes
│   └── reminder.js         # Reminder CRUD routes
├── middleware/
│   └── authMiddleware.js   # JWT authentication middleware
└── client/                 # React frontend
    ├── package.json        # Frontend dependencies
    ├── public/
    │   └── index.html      # Main HTML file
    └── src/
        ├── App.js          # Main React component
        ├── index.js        # React entry point
        ├── components/     # React components
        │   ├── Navbar.js
        │   ├── Signup.js
        │   ├── Login.js
        │   ├── ReminderForm.js
        │   ├── ReminderList.js
        │   └── EditReminder.js
        └── styles/         # CSS files
            ├── index.css
            └── App.css
```

## API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login user

### Reminders (Protected Routes)
- `GET /reminder` - Get all reminders for user
- `GET /reminder/:id` - Get specific reminder
- `POST /reminder` - Create new reminder
- `PUT /reminder/:id` - Update reminder
- `DELETE /reminder/:id` - Delete reminder

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd expiry-date-tracker
```

### 2. Backend Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   - Rename `config.env` to `.env` (optional)
   - Update the MongoDB connection string in `config.env`:
     ```

3. **Start Backend Server**
   ```bash
   npm run dev
   ```

### 3. Frontend Setup

1. **Navigate to Client Directory**
   ```bash
   cd client
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Frontend Development Server**
   ```bash
   npm start
   ```

### 4. Run Both Servers (Optional)
From the root directory:
```bash
npm run dev:full
```

## Usage

1. **Sign Up**: Create a new account with name, email, and password
2. **Login**: Access your account with email and password
3. **Add Reminders**: Create reminders for items with expiry dates
4. **Manage Reminders**: View, edit, and delete your reminders
5. **Track Expiry**: Monitor expiry status with color-coded indicators

## Features in Detail

### Authentication
- Secure password hashing with bcrypt
- JWT token-based authentication
- Protected routes for user data
- Automatic token storage in localStorage

### Reminder Management
- Create reminders with item type, expiry date, and notification settings
- Optional image URLs for visual reference
- Multiple notification day options (1, 2, 3, 5, 7, 10, 14 days)
- Edit and delete functionality

### Expiry Status
- **Expired**: Red indicator for past expiry dates
- **Warning**: Red indicator for items expiring within 3 days
- **Soon**: Orange indicator for items expiring within 7 days
- **Safe**: Green indicator for items with more than 7 days

### User Interface
- Modern, responsive design
- Intuitive navigation
- Form validation and error handling
- Loading states and success messages
- Confirmation dialogs for destructive actions

## Environment Variables

Create a `config.env` file in the root directory:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

### Mailer & Agenda (Email notifications)

If you want the app to send email notifications before item expiry (recommended), add the following variables to `config.env`:

```env
# SMTP / email provider settings
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
EMAIL_FROM="Expiry Tracker" <no-reply@yourdomain.com>

# Optional: tune Agenda
AGENDA_COLLECTION=agendaJobs
```

Notes:
- The project uses `nodemailer` to send emails and `agenda` to schedule jobs in MongoDB.
- Agenda jobs are started automatically when the server starts (it uses the same MongoDB connection).
- When creating/updating reminders, the server schedules jobs for each selected `notifyBeforeDays`. Jobs are persisted in MongoDB and survive restarts.

Security:
- Keep SMTP credentials private. Do not commit `config.env` to source control.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.


