# 🚀 Smart Business Dashboard

An AI-powered business data analysis platform designed to help teams analyze metrics, upload datasets, generate reports, and forecast business performance.

---

## 📁 Project Structure (Monorepo)

```text
smart-business-dashboard/
├── client/                     # React (Vite) Frontend
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Layout, Navbar, Sidebar, ProtectedRoute
│   │   ├── context/            # AuthContext (Firebase Auth)
│   │   ├── firebase/           # Firebase configuration
│   │   ├── pages/              # Login, Signup, Dashboard pages
│   │   ├── App.jsx             # Router & page routes
│   │   ├── index.css           # Tailwind CSS directives & global styling
│   │   └── main.jsx            # Application entry point
│   ├── .env.example            # Sample client environment variables
│   ├── package.json            # Client dependencies and scripts
│   ├── tailwind.config.js      # Tailwind CSS configuration
│   └── vite.config.js          # Vite configuration
│
├── server/                     # Node.js + Express Backend
│   ├── src/
│   │   ├── config/             # DB & configuration (Mongoose connection)
│   │   ├── controllers/        # Request handlers (Health, Auth, etc.)
│   │   ├── models/             # Mongoose schemas & data models
│   │   ├── routes/             # Express API routes
│   │   └── server.js           # Express app entry point
│   ├── .env.example            # Sample server environment variables
│   └── package.json            # Server dependencies and scripts
│
├── .gitignore                  # Git ignore rules
├── package.json                # Root package for workspace scripts
└── README.md                   # Project documentation
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Lucide React (Icons), Firebase Authentication.
- **Backend**: Node.js, Express.js, Mongoose (MongoDB), CORS, Dotenv.
- **Authentication**: Firebase Authentication (Email/Password & Google Sign-in).

---

## ⚡ Quick Start & Installation

### 1. Install Dependencies

You can install all dependencies across both client and server from the root directory:

```bash
npm run install:all
```

Or install them individually:

```bash
# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

---

### 2. Configure Environment Variables

#### Backend (`/server/.env`):
Copy the example file and update values if needed:
```bash
cp server/.env.example server/.env
```
Default server environment variables:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/smart_business_dashboard
CLIENT_URL=http://localhost:5173
```

#### Frontend (`/client/.env`):
Copy the example file and add your Firebase project credentials:
```bash
cp client/.env.example client/.env
```
Default client environment variables:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_BASE_URL=http://localhost:5000/api
```

> **Note**: If Firebase credentials are not yet configured, the app provides an interactive Demo Mode toggle on the login page so you can explore the UI immediately.

---

### 3. Running the Application

You can run both client and server simultaneously from the root directory:

```bash
npm run dev
```

Or run them independently in separate terminals:

#### Run Server:
```bash
cd server
npm run dev
```
- API Base URL: `http://localhost:5000`
- Health Check: `http://localhost:5000/api/health`

#### Run Client:
```bash
cd client
npm run dev
```
- Client App: `http://localhost:5173`

---

## 🎯 Phase 1 Features Included

- **Express Server**: Configured with CORS, JSON body parser, and graceful MongoDB Mongoose connection.
- **Health Check Route**: `GET /api/health` returning `{ status: "ok", timestamp: ... }`.
- **Firebase Authentication**:
  - Sign Up (Email & Password)
  - Sign In (Email & Password + Google Sign-In button)
  - Sign Out
- **Protected Routing**: Guards `/dashboard` and redirects unauthenticated users to `/login`.
- **Layout System**:
  - Top **Navbar** with user profile badge and instant logout.
  - Collapsible/styled **Sidebar** with Dashboard, Upload Data, Reports, and Settings links.
- **Dashboard**: Welcomes the authenticated user (`Welcome, [user email]`) with a modern analytics starter overview.

---

## 🔮 Upcoming Phases

- **Phase 2**: CSV/Excel Dataset Upload, Data Parsing & Validation, MongoDB Dataset Storage.
- **Phase 3**: Interactive Data Visualizations & Dynamic Business Metrics.
- **Phase 4**: AI-Powered Business Insights & Automated Anomaly Detection.
- **Phase 5**: Predictive Forecasting & PDF/CSV Business Report Generation.
