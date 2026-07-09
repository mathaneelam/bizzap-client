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
  reason        TEXT,
  copy_draft    TEXT,                         -- JSON blob of Claude-generated copy (pasted via Admin Dashboard)
  status        VARCHAR(50) DEFAULT 'new',    -- new|demo_built|contacted|replied|call|won|lost|dnc
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
