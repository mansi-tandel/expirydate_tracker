# Expiry Date Tracker - Project Documentation

## 1. Frontend Development

### 1.1 Routes & Components

| Route | Component | Description |
|-------|-----------|-------------|
| / | ReminderList | Landing page displaying all reminders for authenticated user |
| /login | Login | User login page |
| /signup | Signup | User registration page |
| /add-reminder | ReminderForm | Create a new reminder with item details |
| /edit-reminder/:id | EditReminder | Edit existing reminder details |
| /search-reminder | SearchReminder | Search reminders by item type |
| /reminders/:filter | ReminderList | Display filtered reminders (expired, soon, safe) |
| * | Navigate | Redirects to home page for undefined routes |

### 1.2 State Management

• React `useState` and `useEffect` hooks manage component state.
• Axios is used for making API calls to the backend with interceptors for JWT token handling.
• Components are modular, with each feature implemented as a separate component:
  - `Navbar.jsx` - Navigation bar with user authentication state
  - `Login.jsx` - User login form component
  - `Signup.jsx` - User registration form component
  - `ReminderForm.jsx` - Form to create new reminders
  - `ReminderList.jsx` - Display list of reminders with filtering
  - `EditReminder.jsx` - Edit existing reminder component
  - `SearchReminder.jsx` - Search functionality component
• Authentication state is managed in `App.jsx` using React Context via `Outlet` context prop.
• JWT tokens and user data are stored in `localStorage` for persistent authentication.
• `RequireAuth.jsx` component protects routes by checking for authenticated user in localStorage.

## 2. Backend Development

### 2.1 Express Routes

The backend routes are defined in `routes/auth.js` and `routes/reminder.js`. Main routes include:

#### Authentication Routes (`/auth`)

| HTTP Method | Route | Functionality |
|-------------|-------|---------------|
| POST | /auth/signup | User registration with email validation and password hashing |
| POST | /auth/login | User login with JWT token generation |

#### Reminder Routes (`/reminder`)

| HTTP Method | Route | Functionality |
|-------------|-------|---------------|
| GET | /reminder | Fetch all reminders for authenticated user |
| GET | /reminder/search | Search reminders by item type (query parameter: q) |
| GET | /reminder/:id | Get specific reminder by ID |
| POST | /reminder | Create new reminder with image upload support |
| PUT | /reminder/:id | Update existing reminder with optional image update |
| DELETE | /reminder/:id | Delete reminder and associated scheduled jobs |

#### System Routes

| HTTP Method | Route | Functionality |
|-------------|-------|---------------|
| GET | / | API status message |
| GET | /status | Server and MongoDB connection status |

### 2.2 Middleware

• `authMiddleware.js` - JWT authentication middleware that:
  - Extracts Bearer token from Authorization header
  - Verifies JWT token using JWT_SECRET
  - Attaches authenticated user to `req.user`
  - Protects all reminder routes (applied via `router.use(authMiddleware)`)
• `express-validator` - Input validation middleware for:
  - Email format validation
  - Password length validation (minimum 6 characters)
  - Name length validation (minimum 2 characters)
  - Expiry date ISO8601 format validation
  - NotifyBeforeDays array validation
• `multer` - File upload middleware for:
  - Image file uploads (single file)
  - File type validation (images only)
  - File size limit (5MB)
  - Unique filename generation with timestamp
• Custom logging middleware - Logs all HTTP requests with method, URL, status code, and response time
• Error handling middleware - Catches and formats unhandled errors
• CORS middleware - Enables cross-origin requests
• JSON body parser - Parses incoming JSON request bodies
• Static file serving - Serves uploaded images from `/uploads` directory

### 2.3 Controllers

The logic for each route is implemented in route files:

**`routes/auth.js`** handles:
• User registration with bcrypt password hashing
• Email uniqueness validation
• JWT token generation on signup/login
• User authentication and credential verification
• Input validation using express-validator

**`routes/reminder.js`** handles:
• CRUD operations for reminders (Create, Read, Update, Delete)
• User-specific reminder filtering (only user's own reminders)
• Image upload and file management
• Reminder search functionality with regex pattern matching
• Integration with Agenda job scheduler for email notifications
• Notification scheduling when reminders are created/updated
• Job cancellation when reminders are deleted
• Old image cleanup on update/delete

**Background Workers:**
• `worker/agenda.js` - MongoDB-backed job scheduler for sending reminder emails
• `worker/cron.js` - Daily cron job (runs at 09:00) to process reminders and send notifications

## 3. Database (MongoDB)

The project uses MongoDB Atlas as a cloud database. The schema design includes collections for users, reminders, and scheduled jobs.

### 3.1 Models

The backend `models/` folder contains MongoDB schemas using Mongoose:

• **User.js** → User schema:
  - `name` (String, required, trimmed)
  - `email` (String, required, unique, lowercase, trimmed)
  - `password` (String, required, minimum 6 characters)
  - `timestamps` (createdAt, updatedAt)

• **Reminder.js** → Reminder schema:
  - `userId` (ObjectId, required, references User)
  - `itemType` (String, required, trimmed)
  - `image` (String, default empty string)
  - `expiryDate` (Date, required)
  - `notifyBeforeDays` (Array of Numbers, default [1, 3, 7])
  - `notificationsSent` (Array of objects with `daysBefore` and `sentAt`)
  - `timestamps` (createdAt, updatedAt)

• **agendaJobs** (Collection) → Agenda job scheduler collection:
  - Managed by Agenda library
  - Stores scheduled email notification jobs
  - Persists jobs in MongoDB for reliability

### 3.2 Relationships

• **One-to-Many** between Users and Reminders:
  - One user can have multiple reminders
  - Each reminder belongs to one user (via `userId` reference)
  - Reminders are filtered by `userId` in all queries

• **One-to-Many** between Reminders and Notifications:
  - One reminder can have multiple notification records
  - Stored as embedded array in `notificationsSent` field
  - Tracks which notification days have been sent

• **One-to-Many** between Reminders and Agenda Jobs:
  - One reminder can have multiple scheduled jobs (one per `notifyBeforeDays` value)
  - Jobs are linked via `reminderId` in job data
  - Jobs are automatically cancelled when reminder is deleted

## 4. Integration

The system integrates the three layers:

### 4.1 Frontend to Backend Integration

1. **API Communication:**
   - React frontend sends HTTP requests via Axios (`client/src/api.js`)
   - Axios instance configured with base URL and interceptors
   - JWT token automatically attached to request headers (except auth endpoints)
   - Token stored in localStorage and retrieved on each request

2. **Authentication Flow:**
   - User signs up/logs in → Backend validates and returns JWT token
   - Frontend stores token in localStorage
   - All protected routes require token in Authorization header
   - `RequireAuth` component redirects to login if no token found

3. **Data Flow:**
   - Components fetch data using Axios API calls
   - Responses handled with React state management
   - Error handling displays user-friendly messages
   - Loading states managed with component state

### 4.2 Backend to Database Integration

1. **MongoDB Connection:**
   - Mongoose connects to MongoDB Atlas using connection string from `config.env`
   - Connection established in `server.js` on application startup
   - Connection state monitored and logged

2. **Data Operations:**
   - All database operations use Mongoose models (User, Reminder)
   - Queries filtered by user ID for data isolation
   - Transactions and error handling for data integrity
   - Timestamps automatically managed by Mongoose

3. **Job Scheduling:**
   - Agenda library uses same MongoDB connection for job persistence
   - Jobs stored in `agendaJobs` collection
   - Jobs survive server restarts
   - Cron jobs run independently for daily reminder processing

### 4.3 Email Notification Integration

1. **SMTP Configuration:**
   - Nodemailer configured with SMTP settings from environment variables
   - Supports various email providers (SendGrid, Gmail, etc.)
   - Email credentials stored securely in `config.env`

2. **Notification Triggers:**
   - **Agenda Jobs:** Scheduled when reminders are created/updated
   - **Cron Jobs:** Daily processing at 09:00 to catch missed notifications
   - Both systems check `notificationsSent` to prevent duplicate emails

3. **Email Content:**
   - Personalized with user name and item details
   - Includes expiry date and days before expiry
   - HTML and plain text formats supported

### 4.4 File Upload Integration

1. **Image Upload:**
   - Multer middleware handles file uploads in reminder routes
   - Files stored in `uploads/` directory
   - Unique filenames generated with timestamp and random number
   - Image paths stored in database as `/uploads/filename.ext`

2. **File Serving:**
   - Express static middleware serves uploaded images
   - Images accessible via `/uploads/:filename` URL
   - Old images deleted when reminders are updated/deleted

### 4.5 External Services

• **MongoDB Atlas:** Cloud database hosting
• **SMTP Email Service:** For sending reminder notifications (configurable via environment variables)
• **No external APIs** (unlike the reference project - this is a simpler expiry tracking system)

