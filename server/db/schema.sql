-- RoadRescue Database Schema

-- Users table (drivers, mechanics, admin)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('driver', 'mechanic', 'admin')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles table (driver's vehicle profiles)
CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid', 'cng')),
  color TEXT,
  plate_number TEXT,
  is_default INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Mechanics table (extends users with mechanic-specific data)
CREATE TABLE IF NOT EXISTS mechanics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  skills TEXT NOT NULL DEFAULT '[]', -- JSON array of fault categories
  rating REAL DEFAULT 4.0,
  total_ratings INTEGER DEFAULT 0,
  is_available INTEGER DEFAULT 0,
  lat REAL,
  lng REAL,
  active_jobs INTEGER DEFAULT 0,
  avg_response_time_min REAL DEFAULT 15.0,
  total_jobs_done INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Assistance requests
CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  driver_id INTEGER NOT NULL,
  mechanic_id INTEGER,
  vehicle_id INTEGER,
  fault_category TEXT,
  severity TEXT CHECK (severity IN ('green', 'orange', 'red')),
  confidence TEXT CHECK (confidence IN ('Low', 'Medium', 'High')),
  status TEXT NOT NULL DEFAULT 'requested' 
    CHECK (status IN ('requested', 'accepted', 'on_the_way', 'arrived', 'completed', 'cancelled', 'declined')),
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  readings_json TEXT, -- JSON snapshot of vehicle readings
  diagnosis_json TEXT, -- JSON diagnosis result
  checklist_json TEXT, -- JSON pre-arrival checklist
  trend_data_json TEXT, -- JSON 60-sec trend data (Black Box)
  warning_lights_json TEXT, -- JSON array of active warning lights
  symptoms_json TEXT, -- JSON array of reported symptoms
  dispatch_scores_json TEXT, -- JSON ranked mechanic scores
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  accepted_at DATETIME,
  completed_at DATETIME,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_requests_driver ON requests(driver_id);
CREATE INDEX IF NOT EXISTS idx_requests_mechanic ON requests(mechanic_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);

-- Request events (status history timeline)
CREATE TABLE IF NOT EXISTS request_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  lat REAL,
  lng REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_events_request ON request_events(request_id);

-- Ratings / feedback
CREATE TABLE IF NOT EXISTS ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER UNIQUE NOT NULL,
  driver_id INTEGER NOT NULL,
  mechanic_id INTEGER NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  feedback TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES users(id),
  FOREIGN KEY (mechanic_id) REFERENCES users(id)
);

-- Share tokens (shareable live tracking links)
CREATE TABLE IF NOT EXISTS share_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_share_token ON share_tokens(token);
