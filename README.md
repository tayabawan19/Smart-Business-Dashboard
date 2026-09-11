# 🚀 Smart Business Dashboard

An AI-powered business data analysis platform designed to help teams ingest spreadsheets, auto-generate interactive visualizations, perform deep statistical analysis, and forecast business performance.

---

## 📁 Architecture & Monorepo Structure

```text
smart-business-dashboard/
├── client/                     # React (Vite) Frontend (Port 5173)
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Layout, Navbar, Sidebar, Charts, Analysis Section
│   │   ├── context/            # AuthContext (Firebase Auth)
│   │   ├── firebase/           # Firebase configuration
│   │   ├── hooks/              # useDatasetCharts, useDatasetAnalysis
│   │   ├── pages/              # Login, Signup, Dashboard, Upload, Datasets pages
│   │   ├── services/           # API client methods
│   │   ├── App.jsx             # Router & protected routes
│   │   └── index.css           # Tailwind CSS directives & theme
│   ├── .env.example            # Sample client environment variables
│   └── package.json            # Client dependencies and scripts
│
├── server/                     # Node.js + Express Backend (Port 5000)
│   ├── src/
│   │   ├── config/             # MongoDB Mongoose connection
│   │   ├── controllers/        # Dataset, Chart, and Analysis controllers
│   │   ├── middleware/         # Auth, Upload (Multer memory), Rate limiting
│   │   ├── models/             # Dataset model with chartCache & analysisCache
│   │   ├── routes/             # Health, Upload, Dataset, Chart, Analysis endpoints
│   │   ├── utils/              # File parser (PapaParse/XLSX) & chartEngine
│   │   └── server.js           # Express app entry point
│   ├── .env.example            # Sample server environment variables
│   └── package.json            # Server dependencies and scripts
│
├── analysis-service/           # Python Statistical Microservice (FastAPI, Port 8000)
│   ├── main.py                 # FastAPI application & security middleware
│   ├── analyzer.py             # Pandas engine (Trends, Outliers, Rankings, Correlations)
│   ├── requirements.txt        # FastAPI, Uvicorn, Pandas, Pydantic, Dotenv
│   ├── .env.example            # Port & INTERNAL_API_KEY config
│   └── .venv/                  # Python virtual environment
│
├── .gitignore                  # Git ignore rules
├── package.json                # Root orchestration scripts
└── README.md                   # Project documentation
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, React Router v6, Lucide React, Firebase Authentication.
- **Backend**: Node.js (ESM), Express.js, Mongoose (MongoDB), Multer (in-memory storage), PapaParse, XLSX (SheetJS), Helmet, express-rate-limit.
- **Analysis Microservice**: Python 3.14+, FastAPI, Uvicorn, Pandas, NumPy, Pydantic v2.
- **Database**: MongoDB (`smart_business_dashboard`).
- **Security**: Firebase JWT Auth, Formula Injection defense, Magic Byte MIME validation, Internal API Key authentication (`X-Internal-Key`).

---

## ⚡ Quick Start & Setup

### 1. Configure Environment Variables

#### Backend (`/server/.env`):
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/smart_business_dashboard
CLIENT_URL=http://localhost:5173
ANALYSIS_SERVICE_URL=http://localhost:8000
INTERNAL_API_KEY=sbd_internal_secure_key_2026
```

#### Python Microservice (`/analysis-service/.env`):
```env
PORT=8000
INTERNAL_API_KEY=sbd_internal_secure_key_2026
ENVIRONMENT=development
```

#### Frontend (`/client/.env`):
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=AIzaSyBPiAEWgBc09h5NlOCW3OEAA1emf5xNNcE
VITE_FIREBASE_AUTH_DOMAIN=smart-business-4cc00.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=smart-business-4cc00
VITE_FIREBASE_STORAGE_BUCKET=smart-business-4cc00.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=590450859096
VITE_FIREBASE_APP_ID=1:590450859096:web:89fb5a719158d0d6d2be2d
```

---

### 2. Setup Python Virtual Environment

```bash
cd analysis-service
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt   # On Windows
# source .venv/bin/activate && pip install -r requirements.txt   # On macOS/Linux
```

---

### 3. Running All Services

#### Option A: Run All Concurrently (Recommended)
From the root repository directory:
```bash
npm run dev:all
```
This boots Express (5000), Vite (5173), and the Python Microservice (8000) simultaneously.

#### Option B: Run Individually in Separate Terminals
```bash
# 1. Express Backend
cd server
npm run dev

# 2. Python Analysis Service
cd analysis-service
.venv\Scripts\python -m uvicorn main:app --port 8000 --reload

# 3. React Frontend
cd client
npm run dev
```

- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000` (Health check: `/api/health`)
- **Python Service**: `http://localhost:8000` (Health check: `/health`, Docs: `/docs`)

---

## 🎯 Completed Phases

### ✅ Phase 1: Foundation & Authentication
- Express server, MongoDB Mongoose connection, Firebase Authentication (email/password & Google login).
- Protected routing and modern dark-mode layout with responsive navigation.

### ✅ Phase 2: File Upload & Ingestion
- In-memory Multer processing with zero disk footprint.
- CSV (PapaParse) and Excel (SheetJS) parsing with formula injection defense (`=`, `+`, `-`, `@` neutralization).
- Magic-byte MIME validation, schema/type detection (number/date/text), and dataset preview table.

### ✅ Phase 3: Auto-Charting Engine
- Server-side pre-aggregation engine producing KPIs, Time Series Line charts, Category Bar charts, and Distribution Pie charts.
- MongoDB `chartCache` for sub-millisecond instant renders.
- Recharts responsive cards with dark-mode tooltips, gradients, and empty/error fallbacks.

### ✅ Phase 4: Python Statistical Analysis Microservice
- Isolated FastAPI microservice protected with `X-Internal-Key` internal authentication.
- **Period-Over-Period Trend Trajectories**: Direction (`increasing`, `decreasing`, `stable`), overall % change, latest period % change, volatility.
- **Performance Rankings**: Top 5 and Bottom 5 category performers with contribution share bars.
- **Outlier Detection**: Interquartile Range (IQR = Q3 - Q1) rule flagging boundary violations and distances.
- **Comprehensive Summary Statistics**: Mean, median, std dev, min, max, count, and IQR for all numeric metrics.
- **Pearson Correlations**: Cross-metric correlation coefficients with human-readable strength classifications.
- Express backend caching (`analysisCache`) with 15-second timeout and graceful 503 fallback.

### ✅ Phase 5: AI Explanation Layer
- Multi-provider LLM integration (OpenAI, Claude, Gemini) with intelligent local business synthesizer fallback.
- Plain-English business narratives explaining performance, outlier anomalies, and actionable takeaways.
- Mongo caching (`insightsCache`) and hourly rate-limiting for cost and abuse control.

### ✅ Phase 6: Predictive Forecast Module
- Python FastAPI forecasting engine (`/forecast`) with `X-Internal-Key` authentication.
- Lightweight linear trend extrapolation projecting the next 3 to 6 periods forward.
- Minimum data validation: requires $\ge 5$ historical time periods to prevent low-confidence guesses.
- ±1.96 standard error confidence band calculation expanding slightly over the future horizon.
- Backend caching (`forecastCache`), rate limiting, and graceful 503 handling for service downtime.
- Plain-English AI explanation sentence honestly caveating projections as estimates, not guarantees.
- Extended Recharts interactive visualization combining historical actuals (solid), projected estimates (dashed purple), and shaded confidence interval envelope.
- Prominent UX honesty notices, disclaimers, and interactive tooltips.

---

## 🔮 Next: Phase 7 & 8
- **Phase 7: Chat-with-Data Engine**: Conversational Q&A querying datasets and statistical metrics.
- **Phase 8: PDF Report Export**: Export executive summary dashboards into print-ready PDF reports.

