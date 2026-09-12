-- MidBridge 2.0 Normalized Relational Schema

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'USER', -- 'USER', 'ADMIN', 'AUTHORITY', 'UNIVERSITY', 'VERIFIER'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  nationality TEXT,
  current_country TEXT,
  destination_country TEXT,
  purpose TEXT,
  education_level TEXT,
  intended_course TEXT,
  institution TEXT,
  travel_date TEXT,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS countries (
  code TEXT PRIMARY KEY, -- e.g. 'DE', 'US', 'GB'
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  flag_emoji TEXT NOT NULL,
  cover_image TEXT NOT NULL,
  popular_purposes TEXT NOT NULL, -- JSON array string
  summary TEXT NOT NULL,
  processing_time_weeks INTEGER DEFAULT 6,
  currency TEXT,
  language TEXT
);

CREATE TABLE IF NOT EXISTS country_content (
  id TEXT PRIMARY KEY,
  country_code TEXT NOT NULL REFERENCES countries(code) ON DELETE CASCADE,
  category TEXT NOT NULL, -- overview, study, work, visa, documents, scholarships, health, financial, travel, arrival, emergency, resources
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_organization TEXT NOT NULL,
  source_url TEXT NOT NULL,
  last_checked TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS journeys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_country TEXT NOT NULL,
  to_country TEXT NOT NULL,
  purpose TEXT NOT NULL,
  current_stage_number INTEGER DEFAULT 1,
  current_stage_name TEXT DEFAULT 'Researching',
  readiness_score INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journey_stages (
  id TEXT PRIMARY KEY,
  journey_id TEXT NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  stage_number INTEGER NOT NULL,
  stage_name TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED', -- 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'NEEDS_ATTENTION'
  due_date TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS requirements (
  id TEXT PRIMARY KEY,
  nationality TEXT, -- NULL means any nationality
  destination TEXT NOT NULL,
  purpose TEXT NOT NULL,
  category TEXT NOT NULL, -- Identity, Academic, Immigration, Financial, Medical, Insurance, Employment, Travel, Arrival, Other
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  mandatory BOOLEAN DEFAULT true,
  stage_number INTEGER DEFAULT 5,
  source_url TEXT,
  last_updated TEXT
);

CREATE TABLE IF NOT EXISTS user_requirements (
  id TEXT PRIMARY KEY,
  journey_id TEXT NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  requirement_id TEXT NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'NOT_UPLOADED', -- 'NOT_UPLOADED', 'IN_PROGRESS', 'UPLOADED', 'AI_ANALYZED', 'VERIFICATION_PENDING', 'VERIFIED', 'NEEDS_ATTENTION', 'EXPIRED', 'REJECTED'
  notes TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  journey_id TEXT REFERENCES journeys(id) ON DELETE SET NULL,
  requirement_id TEXT,
  category TEXT NOT NULL, -- IDENTITY, EDUCATION, IMMIGRATION, FINANCIAL, HEALTH, EMPLOYMENT, OTHER
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  file_hash TEXT NOT NULL, -- SHA-256
  ai_analysis_json TEXT,
  verification_status TEXT NOT NULL DEFAULT 'UPLOADED', -- 'UPLOADED', 'AI_ANALYZED', 'VERIFICATION_PENDING', 'ISSUER_VERIFIED', 'DIGITAL_SIGNATURE_VERIFIED', 'QR_VERIFIED', 'VERIFIED', 'NEEDS_REVIEW', 'EXPIRED', 'INVALID'
  issuer TEXT,
  issue_date TEXT,
  expiry_date TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_verifications (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  verifier_id TEXT NOT NULL,
  verifier_role TEXT NOT NULL,
  status TEXT NOT NULL, -- 'VERIFIED', 'REJECTED', 'NEEDS_REVIEW'
  reason TEXT,
  signature_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scholarships (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country_code TEXT NOT NULL REFERENCES countries(code) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  level TEXT NOT NULL,
  eligible_nationalities TEXT NOT NULL, -- JSON array string or '*'
  field TEXT NOT NULL,
  funding_type TEXT NOT NULL, -- 'Full Tuition', 'Full Tuition + Stipend', 'Partial Grant', 'Travel Allowance'
  deadline TEXT NOT NULL,
  description TEXT NOT NULL,
  official_source TEXT NOT NULL,
  last_checked TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS share_packages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT,
  allow_download BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NOT NULL,
  is_revoked BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS share_package_documents (
  id TEXT PRIMARY KEY,
  share_package_id TEXT NOT NULL REFERENCES share_packages(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS emergency_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  nationality TEXT NOT NULL,
  emergency_contact TEXT NOT NULL,
  blood_group TEXT,
  allergies_medical_notes TEXT,
  insurance_details TEXT,
  embassy_info TEXT,
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL, -- 'DOCUMENT_EXPIRY', 'MISSING_REQUIREMENT', 'JOURNEY_UPDATE', 'SCHOLARSHIP_REMINDER', 'VERIFICATION_RESULT', 'SHARE_ACCESSED', 'TRAVEL_TASK', 'OFFICIAL_UPDATE'
  is_read BOOLEAN DEFAULT false,
  link_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  journey_id TEXT REFERENCES journeys(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  due_date TEXT NOT NULL,
  category TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata_json TEXT,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assistant_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assistant_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES assistant_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user', 'assistant'
  content TEXT NOT NULL,
  context_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_journeys_user ON journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_requirements_dest ON requirements(destination, purpose);
CREATE INDEX IF NOT EXISTS idx_scholarships_country ON scholarships(country_code);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_share_packages_token ON share_packages(share_token);

-- =========================================================================
-- MIDBRIDGE 2.0 EXTENSIONS: HEALTH VAULT, MOBILITY TWIN & COST PLANNER
-- =========================================================================

-- 1. Health Vault Documents (Private by default)
CREATE TABLE IF NOT EXISTS health_documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'VACCINATION', 'MEDICAL_CERTIFICATE', 'TRAVEL_INSURANCE', 'HEALTH_INSURANCE', 'MEDICAL_FITNESS', 'PRESCRIPTION', 'ALLERGY_RECORD', 'REQUIRED_TEST', 'COUNTRY_REQUIRED', 'EMERGENCY_HEALTH', 'OTHER'
  title TEXT NOT NULL,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'UPLOADED', -- 'NOT_UPLOADED', 'UPLOADED', 'AI_ANALYZED', 'VERIFICATION_PENDING', 'VERIFIED', 'NEEDS_REVIEW', 'EXPIRED'
  issuer TEXT,
  issue_date TEXT,
  expiry_date TEXT,
  ai_analysis_json TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Health Requirements by Country/Purpose
CREATE TABLE IF NOT EXISTS health_requirements (
  id TEXT PRIMARY KEY,
  country_code TEXT NOT NULL,
  purpose TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Mobility Twin Snapshots (Live digital representation state)
CREATE TABLE IF NOT EXISTS mobility_twin_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  journey_id TEXT REFERENCES journeys(id) ON DELETE CASCADE,
  overall_readiness INTEGER NOT NULL DEFAULT 0,
  doc_readiness INTEGER NOT NULL DEFAULT 0,
  health_readiness INTEGER NOT NULL DEFAULT 0,
  financial_readiness INTEGER NOT NULL DEFAULT 0,
  visa_readiness INTEGER NOT NULL DEFAULT 0,
  travel_readiness INTEGER NOT NULL DEFAULT 0,
  arrival_readiness INTEGER NOT NULL DEFAULT 0,
  current_blocker TEXT,
  recommended_action TEXT,
  twin_state_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Mobility Simulations (What-if scenario comparisons)
CREATE TABLE IF NOT EXISTS mobility_simulations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  origin_country TEXT NOT NULL,
  dest_country TEXT NOT NULL,
  purpose TEXT NOT NULL,
  simulation_name TEXT,
  diff_summary_json TEXT,
  simulated_readiness INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Cost Planner Plans
CREATE TABLE IF NOT EXISTS cost_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  journey_id TEXT REFERENCES journeys(id) ON DELETE CASCADE,
  home_currency TEXT NOT NULL DEFAULT 'INR',
  dest_currency TEXT NOT NULL DEFAULT 'EUR',
  exchange_rate NUMERIC NOT NULL DEFAULT 0.011,
  exchange_rate_source TEXT DEFAULT 'Manual / Estimated rate',
  last_rate_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Cost Planner Items
CREATE TABLE IF NOT EXISTS cost_items (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES cost_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'APPLICATION', 'DOCUMENTATION', 'IMMIGRATION', 'HEALTH', 'EDUCATION', 'FINANCIAL_REQUIREMENTS', 'TRAVEL', 'ACCOMMODATION', 'ARRIVAL', 'EMERGENCY', 'OTHER'
  timing TEXT NOT NULL DEFAULT 'PRE_DEPARTURE', -- 'PRE_DEPARTURE', 'FIRST_MONTH', 'MONTHLY_RECURRING', 'YEAR_ONE'
  estimated_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  is_mandatory BOOLEAN DEFAULT true,
  source TEXT,
  user_edited BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Cost Planner Funding Sources
CREATE TABLE IF NOT EXISTS funding_sources (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES cost_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  funding_type TEXT NOT NULL, -- 'PERSONAL_SAVINGS', 'SCHOLARSHIP', 'SPONSOR', 'STUDENT_LOAN', 'OTHER'
  status TEXT NOT NULL DEFAULT 'PLANNED', -- 'PLANNED', 'APPLIED', 'AWARDED_CONFIRMED'
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  scholarship_id TEXT REFERENCES scholarships(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Selective Health Share Packages (Strictly separate from Vault share)
CREATE TABLE IF NOT EXISTS health_share_packages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT,
  allow_download BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NOT NULL,
  is_revoked BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Health Share Package Documents
CREATE TABLE IF NOT EXISTS health_share_documents (
  id TEXT PRIMARY KEY,
  health_share_id TEXT NOT NULL REFERENCES health_share_packages(id) ON DELETE CASCADE,
  health_doc_id TEXT NOT NULL REFERENCES health_documents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_health_docs_user ON health_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_cost_items_plan ON cost_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_cost_plans_user ON cost_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_funding_plan ON funding_sources(plan_id);
CREATE INDEX IF NOT EXISTS idx_health_shares_token ON health_share_packages(share_token);
