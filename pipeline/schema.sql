-- Bizzap Local Sites — PostgreSQL Schema

-- 1. Businesses Table (Raw source records from scraper/manual entry)
CREATE TABLE IF NOT EXISTS businesses (
  id            SERIAL PRIMARY KEY,
  place_ref     VARCHAR(255) UNIQUE,          -- Unique maps place identifier or assigned id
  name          VARCHAR(255) NOT NULL,
  category      VARCHAR(100),
  segment       VARCHAR(50),                  -- manufacturer | shop | clinic | food | services
  phone         VARCHAR(50),
  website       TEXT,
  rating        REAL,
  review_count  INTEGER,
  address       TEXT,
  lat           REAL, 
  lng           REAL,
  raw           TEXT,                         -- JSON blob of all scraped details
  scraped_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Leads Table (Scored and qualified records)
CREATE TABLE IF NOT EXISTS leads (
  id            SERIAL PRIMARY KEY,
  business_id   INTEGER UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
  score         INTEGER CHECK (score >= 0 AND score <= 100),
  has_website   BOOLEAN DEFAULT FALSE,
  reason        TEXT,                         -- Reason / Call comment / Fix request detail
  copy_draft    TEXT,                         -- JSON blob of Claude-generated copy (pasted via Admin Dashboard)
  gen_count     INTEGER DEFAULT 0,            -- how many times the website copy has been (re)generated
  status        VARCHAR(50) DEFAULT 'new',    -- new|demo_built|contacted|replied|call|won|lost|dnc|needs_fix|ring_no_response|switched_off|unable_to_call|call_back_later|not_interested|already_have_site|others|appointment_scheduled
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- 3. Demos Table (Built & deployed demos awaiting human review)
CREATE TABLE IF NOT EXISTS demos (
  id            SERIAL PRIMARY KEY,
  lead_id       INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  slug          VARCHAR(100) UNIQUE,          -- url friendly slug
  site_json_path TEXT,
  demo_url      TEXT,                         -- https://bizzap-demos.pages.dev/{slug}/
  screenshot    TEXT,                         -- path to screenshotted PNG
  approved      BOOLEAN DEFAULT FALSE,        -- manual review gate
  built_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Clients Table (Converted paying clients)
CREATE TABLE IF NOT EXISTS clients (
  id            SERIAL PRIMARY KEY,
  lead_id       INTEGER REFERENCES leads(id) ON DELETE SET NULL,
  package       VARCHAR(50),                  -- starter|business|manufacturer
  domain        VARCHAR(255),                 -- custom domain bought by/for the client
  site_json_path TEXT,
  live_url      TEXT,
  gbp_managed   BOOLEAN DEFAULT FALSE,        -- whether we manage their GBP profile
  onboarded_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Deals Table (Invoice and payments tracker)
CREATE TABLE IF NOT EXISTS deals (
  id            SERIAL PRIMARY KEY,
  client_id     INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  amount        NUMERIC(10, 2),
  type          VARCHAR(50),                  -- build|renewal|retainer|addon
  status        VARCHAR(50) DEFAULT 'sent',   -- sent|paid|due
  razorpay_id   VARCHAR(100),
  due_date      DATE,
  paid_at       TIMESTAMP WITH TIME ZONE
);

-- 6. Staff Access Table (Dashboard auth gate)
CREATE TABLE IF NOT EXISTS staff_access (
  id           SERIAL PRIMARY KEY,
  email        VARCHAR(255) UNIQUE NOT NULL,
  name         VARCHAR(255),
  avatar_url   TEXT,
  role         VARCHAR(20) DEFAULT 'staff',    -- 'admin' | 'staff'
  status       VARCHAR(20) DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  approved_at  TIMESTAMP WITH TIME ZONE
);

-- Pre-approve the default admin so they are never blocked
INSERT INTO staff_access (email, name, role, status)
VALUES ('mathaneelam@gmail.com', 'Mathan', 'admin', 'approved')
ON CONFLICT (email) DO NOTHING;

-- 7. Activity Log Table (Audit trail of all dashboard actions)
CREATE TABLE IF NOT EXISTS activity_log (
  id           SERIAL PRIMARY KEY,
  user_email   VARCHAR(255) NOT NULL,
  user_name    VARCHAR(255),
  action       VARCHAR(100) NOT NULL,  -- e.g. 'lead_status_changed', 'demo_approved'
  entity_type  VARCHAR(50),            -- 'lead' | 'demo' | 'deal' | 'client' | 'staff'
  entity_id    VARCHAR(100),           -- primary key of the affected row
  entity_label TEXT,                   -- human-readable label, e.g. "Sri Balaji Textiles"
  metadata     JSONB,                  -- extra structured context
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Appointments Table (Calendar & meeting tracking)
CREATE TABLE IF NOT EXISTS appointments (
  id            SERIAL PRIMARY KEY,
  lead_id       INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  scheduled_at  TIMESTAMP WITH TIME ZONE NOT NULL,
  type          VARCHAR(50) DEFAULT 'in_person', -- in_person | phone_call | whatsapp
  notes         TEXT,
  status        VARCHAR(50) DEFAULT 'scheduled',  -- scheduled | completed | rescheduled | cancelled
  created_by    VARCHAR(255),                     -- staff email
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Row Level Security (RLS) Configuration
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable full access to businesses" ON businesses;
CREATE POLICY "Enable full access to businesses" ON businesses FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable full access to leads" ON leads;
CREATE POLICY "Enable full access to leads" ON leads FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE demos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable full access to demos" ON demos;
CREATE POLICY "Enable full access to demos" ON demos FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable full access to clients" ON clients;
CREATE POLICY "Enable full access to clients" ON clients FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable full access to deals" ON deals;
CREATE POLICY "Enable full access to deals" ON deals FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE staff_access ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable full access to staff_access" ON staff_access;
CREATE POLICY "Enable full access to staff_access" ON staff_access FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable full access to activity_log" ON activity_log;
CREATE POLICY "Enable full access to activity_log" ON activity_log FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable full access to appointments" ON appointments;
CREATE POLICY "Enable full access to appointments" ON appointments FOR ALL USING (true) WITH CHECK (true);





