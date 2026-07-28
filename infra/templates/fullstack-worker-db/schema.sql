-- D1 Database Schema Boilerplate for Bizzap Clients

-- 1. Contact Submissions Table (for simple contact forms)
CREATE TABLE IF NOT EXISTS contact_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bookings Table (for appointment or booking requests)
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    booking_date TEXT NOT NULL,       -- YYYY-MM-DD
    booking_time TEXT NOT NULL,       -- HH:MM
    service_requested TEXT,
    status TEXT DEFAULT 'pending',    -- pending | confirmed | cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
