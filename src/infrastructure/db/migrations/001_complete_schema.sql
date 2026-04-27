CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_tier') THEN
    CREATE TYPE user_tier AS ENUM ('free', 'enterprise');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_type') THEN
    CREATE TYPE property_type AS ENUM ('rent', 'sale', 'fractional');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_option') THEN
    CREATE TYPE payment_option AS ENUM ('upfront_escrow', 'rent_wallet');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lease_term') THEN
    CREATE TYPE lease_term AS ENUM ('one_off', 'auto_renewal');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resolution_type') THEN
    CREATE TYPE resolution_type AS ENUM ('owner_100', 'tenant_100', 'percentage_split');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_status') THEN
    CREATE TYPE maintenance_status AS ENUM ('pending', 'inspector_assigned', 'approved', 'completed', 'disputed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
    CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'refunded', 'failed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
    CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel') THEN
    CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'push', 'whatsapp');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  user_tier user_tier DEFAULT 'free',
  wallet_balance BIGINT DEFAULT 0,
  rent_wallet_balance BIGINT DEFAULT 0,
  is_bvn_verified BOOLEAN DEFAULT false,
  trust_score INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  referral_code VARCHAR(20) UNIQUE,
  fcm_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(user_tier);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

CREATE TABLE IF NOT EXISTS user_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  verification_type VARCHAR(20) NOT NULL,
  bvn_number VARCHAR(11),
  nin_number VARCHAR(11),
  government_id_url TEXT,
  selfie_url TEXT,
  criminal_record_clear BOOLEAN DEFAULT false,
  status verification_status DEFAULT 'pending',
  verified_at TIMESTAMP,
  rejected_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_verifications_user ON user_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON user_verifications(status);

CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  property_type property_type DEFAULT 'rent',
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  bedrooms INTEGER DEFAULT 1,
  bathrooms DECIMAL(3, 1) DEFAULT 1,
  square_meters INTEGER,
  amenities JSONB DEFAULT '{}'::jsonb,
  monthly_rent INTEGER,
  sale_price INTEGER,
  fractional_share_price INTEGER,
  total_shares INTEGER,
  available_shares INTEGER,
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  geo_tagged_video_url TEXT,
  certificate_of_occupancy_url TEXT,
  c_o_verified BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  blockchain_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(state, city, is_available);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(monthly_rent);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_bedrooms ON properties(bedrooms);
CREATE INDEX IF NOT EXISTS idx_properties_coords ON properties USING GIST (ll_to_earth(latitude, longitude));
CREATE INDEX IF NOT EXISTS idx_properties_search ON properties USING GIN(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '')));

CREATE TABLE IF NOT EXISTS owner_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  maintenance_response_score DECIMAL(3, 2) DEFAULT 0,
  dispute_resolution_score DECIMAL(3, 2) DEFAULT 0,
  renewal_rate_score DECIMAL(3, 2) DEFAULT 0,
  communication_score DECIMAL(3, 2) DEFAULT 0,
  overall_rating DECIMAL(3, 2) DEFAULT 0,
  rating_badge INTEGER DEFAULT 3,
  pending_maintenance_count INTEGER DEFAULT 0,
  completed_maintenance_count INTEGER DEFAULT 0,
  search_priority_multiplier DECIMAL(3, 2) DEFAULT 1.00,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_owner_ratings_owner ON owner_ratings(owner_id);
CREATE INDEX IF NOT EXISTS idx_owner_ratings_score ON owner_ratings(overall_rating DESC);
CREATE INDEX IF NOT EXISTS idx_owner_ratings_priority ON owner_ratings(search_priority_multiplier DESC);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference VARCHAR(50) UNIQUE NOT NULL,
  payer_id UUID REFERENCES users(id),
  payee_id UUID REFERENCES users(id),
  property_id UUID REFERENCES properties(id),
  lease_id UUID,
  amount BIGINT NOT NULL,
  commission BIGINT DEFAULT 0,
  tax_withheld BIGINT DEFAULT 0,
  net_amount BIGINT DEFAULT 0,
  payment_method VARCHAR(50),
  transaction_type VARCHAR(50),
  status transaction_status DEFAULT 'pending',
  escrow_release_at TIMESTAMP,
  auto_refund_at TIMESTAMP,
  completed_at TIMESTAMP,
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_payer ON transactions(payer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payee ON transactions(payee_id);
CREATE INDEX IF NOT EXISTS idx_transactions_property ON transactions(property_id);
CREATE INDEX IF NOT EXISTS idx_transactions_lease ON transactions(lease_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);

CREATE TABLE IF NOT EXISTS leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id),
  tenant_id UUID REFERENCES users(id),
  owner_id UUID REFERENCES users(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_rent INTEGER NOT NULL,
  security_deposit INTEGER,
  payment_option payment_option NOT NULL,
  lease_term lease_term DEFAULT 'one_off',
  auto_renewal_enabled BOOLEAN DEFAULT false,
  renewal_notice_days INTEGER DEFAULT 60,
  escrow_balance BIGINT DEFAULT 0,
  e_signature_url TEXT,
  blockchain_hash VARCHAR(255),
  legal_notice_generated BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  terminated_at TIMESTAMP,
  termination_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leases_tenant ON leases(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_leases_owner ON leases(owner_id, is_active);
CREATE INDEX IF NOT EXISTS idx_leases_property ON leases(property_id);
CREATE INDEX IF NOT EXISTS idx_leases_dates ON leases(end_date) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_leases_auto_renewal ON leases(auto_renewal_enabled, end_date);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_transactions_lease'
  ) THEN
    ALTER TABLE transactions
      ADD CONSTRAINT fk_transactions_lease
      FOREIGN KEY (lease_id) REFERENCES leases(id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS payment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES leases(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  amount INTEGER NOT NULL,
  amount_paid INTEGER DEFAULT 0,
  status transaction_status DEFAULT 'pending',
  transaction_id UUID REFERENCES transactions(id),
  is_automatic BOOLEAN DEFAULT false,
  retry_count INTEGER DEFAULT 0,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_schedules_lease ON payment_schedules(lease_id, due_date);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_status ON payment_schedules(status, due_date);

CREATE TABLE IF NOT EXISTS rent_wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  amount BIGINT NOT NULL,
  balance_before BIGINT NOT NULL,
  balance_after BIGINT NOT NULL,
  transaction_type VARCHAR(20) NOT NULL,
  frequency VARCHAR(10),
  scheduled_for TIMESTAMP,
  source VARCHAR(50),
  reference VARCHAR(50) UNIQUE,
  processed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_user ON rent_wallet_transactions(user_id, processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_type ON rent_wallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_scheduled ON rent_wallet_transactions(scheduled_for) WHERE scheduled_for IS NOT NULL;

CREATE TABLE IF NOT EXISTS maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES leases(id),
  tenant_id UUID REFERENCES users(id),
  owner_id UUID REFERENCES users(id),
  property_id UUID REFERENCES properties(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  priority VARCHAR(20) DEFAULT 'medium',
  resolution_type resolution_type,
  owner_percentage INTEGER,
  tenant_percentage INTEGER,
  estimated_cost INTEGER,
  final_cost INTEGER,
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  timestamped_photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  gps_coordinates POINT,
  blockchain_hash VARCHAR(255),
  status maintenance_status DEFAULT 'pending',
  inspector_id UUID REFERENCES users(id),
  inspector_report_url TEXT,
  inspector_fee INTEGER DEFAULT 0,
  vendor_id UUID,
  vendor_name VARCHAR(255),
  deducted_from_next_rent BOOLEAN DEFAULT false,
  reported_at TIMESTAMP DEFAULT NOW(),
  inspected_at TIMESTAMP,
  completed_at TIMESTAMP,
  tenant_satisfaction INTEGER CHECK (tenant_satisfaction BETWEEN 1 AND 5)
);

CREATE INDEX IF NOT EXISTS idx_maintenance_lease ON maintenance_requests(lease_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_owner ON maintenance_requests(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_maintenance_tenant ON maintenance_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_priority ON maintenance_requests(priority, status);

CREATE TABLE IF NOT EXISTS inspectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE,
  license_number VARCHAR(100),
  company_name VARCHAR(255),
  years_experience INTEGER DEFAULT 0,
  service_areas TEXT[] DEFAULT ARRAY[]::TEXT[],
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_inspections INTEGER DEFAULT 0,
  acceptance_rate DECIMAL(5, 2) DEFAULT 100,
  is_available BOOLEAN DEFAULT true,
  max_daily_inspections INTEGER DEFAULT 3,
  total_earned BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inspectors_available ON inspectors(is_available, average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_inspectors_areas ON inspectors(service_areas);

CREATE TABLE IF NOT EXISTS negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id),
  initiator_id UUID REFERENCES users(id),
  counterparty_id UUID REFERENCES users(id),
  lease_id UUID REFERENCES leases(id),
  proposed_price INTEGER,
  proposed_term_months INTEGER,
  proposed_start_date DATE,
  market_avg_price INTEGER,
  market_percentile INTEGER,
  comparable_properties JSONB,
  ai_suggestion TEXT,
  ai_confidence DECIMAL(3, 2),
  counter_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  accepted_at TIMESTAMP,
  rejected_at TIMESTAMP,
  expiry_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_negotiations_property ON negotiations(property_id, status);
CREATE INDEX IF NOT EXISTS idx_negotiations_initiator ON negotiations(initiator_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_counterparty ON negotiations(counterparty_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_status ON negotiations(status, expiry_date);

CREATE TABLE IF NOT EXISTS negotiation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id UUID REFERENCES negotiations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  message TEXT,
  proposed_price INTEGER,
  proposed_term INTEGER,
  is_ai_generated BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_negotiation_messages_neg ON negotiation_messages(negotiation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_negotiation_messages_sender ON negotiation_messages(sender_id);

CREATE TABLE IF NOT EXISTS legal_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES leases(id),
  generated_by UUID REFERENCES users(id),
  notice_type VARCHAR(50) NOT NULL,
  notice_period_days INTEGER,
  content TEXT NOT NULL,
  delivery_method VARCHAR(50),
  delivered_at TIMESTAMP,
  delivery_proof_url TEXT,
  owner_signature_url TEXT,
  tenant_signature_url TEXT,
  blockchain_hash VARCHAR(255),
  status VARCHAR(20) DEFAULT 'draft',
  acknowledged_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legal_notices_lease ON legal_notices(lease_id);
CREATE INDEX IF NOT EXISTS idx_legal_notices_status ON legal_notices(status);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(30) NOT NULL,
  channel notification_channel NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT,
  action_id UUID,
  data JSONB DEFAULT '{}'::jsonb,
  delivered BOOLEAN DEFAULT false,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_pending ON notifications(delivered, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_channel ON notifications(channel);

CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opened_by UUID REFERENCES users(id),
  against_user UUID REFERENCES users(id),
  lease_id UUID REFERENCES leases(id),
  transaction_id UUID REFERENCES transactions(id),
  maintenance_id UUID REFERENCES maintenance_requests(id),
  dispute_type VARCHAR(30) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  evidence_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  status VARCHAR(20) DEFAULT 'open',
  moderator_id UUID REFERENCES users(id),
  resolution TEXT,
  resolved_at TIMESTAMP,
  escrow_held_amount INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disputes_lease ON disputes(lease_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_opener ON disputes(opened_by);

CREATE TABLE IF NOT EXISTS fractional_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) UNIQUE,
  total_shares INTEGER NOT NULL,
  share_price INTEGER NOT NULL,
  min_purchase_shares INTEGER DEFAULT 1,
  available_shares INTEGER NOT NULL,
  annual_rent_projection INTEGER,
  expected_yield DECIMAL(5, 2),
  last_distribution_date DATE,
  next_distribution_date DATE,
  spv_name VARCHAR(255),
  spv_registration_number VARCHAR(100),
  offering_memorandum_url TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fractional_properties ON fractional_properties(status);
CREATE INDEX IF NOT EXISTS idx_fractional_yield ON fractional_properties(expected_yield DESC);

CREATE TABLE IF NOT EXISTS share_ownerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fractional_property_id UUID REFERENCES fractional_properties(id),
  investor_id UUID REFERENCES users(id),
  shares_held INTEGER NOT NULL,
  percentage_ownership DECIMAL(5, 2),
  initial_investment INTEGER NOT NULL,
  purchase_transaction_id UUID REFERENCES transactions(id),
  certificate_number VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  purchased_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_share_ownerships_investor ON share_ownerships(investor_id);
CREATE INDEX IF NOT EXISTS idx_share_ownerships_property ON share_ownerships(fractional_property_id);
CREATE INDEX IF NOT EXISTS idx_share_ownerships_active ON share_ownerships(is_active);

CREATE TABLE IF NOT EXISTS fractional_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fractional_property_id UUID REFERENCES fractional_properties(id),
  ownership_id UUID REFERENCES share_ownerships(id),
  amount INTEGER NOT NULL,
  shares_at_distribution INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  transaction_id UUID REFERENCES transactions(id),
  tax_withheld INTEGER DEFAULT 0,
  distributed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fractional_distributions_ownership ON fractional_distributions(ownership_id);
CREATE INDEX IF NOT EXISTS idx_fractional_distributions_property ON fractional_distributions(fractional_property_id);

CREATE TABLE IF NOT EXISTS valuation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id),
  requested_by UUID REFERENCES users(id),
  inspector_id UUID REFERENCES inspectors(id),
  ai_valuation INTEGER NOT NULL,
  ai_confidence DECIMAL(3, 2),
  inspector_valuation INTEGER,
  final_valuation INTEGER NOT NULL,
  comparable_properties JSONB,
  report_pdf_url TEXT,
  price_paid INTEGER,
  report_purpose VARCHAR(50),
  status VARCHAR(20) DEFAULT 'processing',
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_valuation_reports_property ON valuation_reports(property_id);
CREATE INDEX IF NOT EXISTS idx_valuation_reports_user ON valuation_reports(requested_by);

CREATE TABLE IF NOT EXISTS logistics_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  lease_id UUID REFERENCES leases(id),
  property_id UUID REFERENCES properties(id),
  service_type VARCHAR(30) NOT NULL,
  booking_type VARCHAR(30) DEFAULT 'move_in',
  pickup_address TEXT NOT NULL,
  pickup_latitude DECIMAL(10, 8),
  pickup_longitude DECIMAL(11, 8),
  dropoff_address TEXT NOT NULL,
  dropoff_latitude DECIMAL(10, 8),
  dropoff_longitude DECIMAL(11, 8),
  distance_km DECIMAL(10, 2),
  preferred_date DATE NOT NULL,
  preferred_time_slot VARCHAR(20),
  item_details JSONB DEFAULT '{}'::jsonb,
  base_price INTEGER NOT NULL,
  distance_charge INTEGER DEFAULT 0,
  extra_charge INTEGER DEFAULT 0,
  discount_amount INTEGER DEFAULT 0,
  total_price INTEGER NOT NULL,
  provider_id UUID,
  provider_name VARCHAR(255),
  provider_phone VARCHAR(15),
  status VARCHAR(20) DEFAULT 'pending',
  payment_status VARCHAR(20) DEFAULT 'pending',
  payment_transaction_id UUID REFERENCES transactions(id),
  tracking_latitude DECIMAL(10, 8),
  tracking_longitude DECIMAL(11, 8),
  completed_at TIMESTAMP,
  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
  user_review TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logistics_user ON logistics_bookings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logistics_status ON logistics_bookings(status);
CREATE INDEX IF NOT EXISTS idx_logistics_date ON logistics_bookings(preferred_date);
CREATE INDEX IF NOT EXISTS idx_logistics_payment ON logistics_bookings(payment_status);

CREATE TABLE IF NOT EXISTS logistics_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name VARCHAR(255) NOT NULL,
  provider_type VARCHAR(30) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  service_radius_km INTEGER DEFAULT 30,
  van_with_movers_price INTEGER,
  boxes_delivery_price INTEGER,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  opening_time TIME DEFAULT '08:00',
  closing_time TIME DEFAULT '18:00',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logistics_providers_type ON logistics_providers(provider_type, is_active);
CREATE INDEX IF NOT EXISTS idx_logistics_providers_rating ON logistics_providers(average_rating DESC);

CREATE TABLE IF NOT EXISTS enterprise_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  cac_registration_number VARCHAR(50) UNIQUE NOT NULL,
  directors_bvn TEXT[] DEFAULT ARRAY[]::TEXT[],
  subscription_plan VARCHAR(20) DEFAULT 'starter',
  monthly_fee INTEGER,
  commission_rate DECIMAL(3, 2) DEFAULT 3.50,
  custom_domain VARCHAR(255),
  custom_subdomain VARCHAR(100) UNIQUE,
  brand_primary_color VARCHAR(7),
  brand_logo_url TEXT,
  max_users INTEGER DEFAULT 5,
  max_properties INTEGER DEFAULT 50,
  api_enabled BOOLEAN DEFAULT false,
  features JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  subscription_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enterprise_cac ON enterprise_organizations(cac_registration_number);
CREATE INDEX IF NOT EXISTS idx_enterprise_domain ON enterprise_organizations(custom_domain);
CREATE INDEX IF NOT EXISTS idx_enterprise_subdomain ON enterprise_organizations(custom_subdomain);

CREATE TABLE IF NOT EXISTS enterprise_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES enterprise_organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(30) NOT NULL,
  permissions JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_org ON enterprise_team_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_user ON enterprise_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_role ON enterprise_team_members(role);

CREATE TABLE IF NOT EXISTS enterprise_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES enterprise_organizations(id) ON DELETE CASCADE,
  key_name VARCHAR(100) NOT NULL,
  api_key VARCHAR(64) UNIQUE NOT NULL,
  api_key_hash VARCHAR(255) NOT NULL,
  permissions JSONB DEFAULT '{"read": true, "write": false}'::jsonb,
  rate_limit INTEGER DEFAULT 100,
  allowed_ips INET[] DEFAULT ARRAY[]::INET[],
  last_used_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_org ON enterprise_api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON enterprise_api_keys(api_key);

CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_property ON favorites(property_id);

CREATE TABLE IF NOT EXISTS property_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  session_id VARCHAR(255),
  ip_address INET,
  viewed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_views_property ON property_views(property_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_views_user ON property_views(user_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES users(id),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  blockchain_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_hash ON audit_logs(blockchain_hash);

CREATE TABLE IF NOT EXISTS commission_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_tier user_tier NOT NULL,
  property_type VARCHAR(20) NOT NULL,
  rate DECIMAL(3, 2) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commission_settings ON commission_settings(user_tier, property_type, effective_from);

CREATE TABLE IF NOT EXISTS logistics_service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  base_price INTEGER NOT NULL,
  estimated_minutes INTEGER,
  includes_workers INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_suggestion_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE,
  wallet_balance BIGINT NOT NULL,
  suggested_properties JSONB,
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '1 hour',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_suggestion_user ON wallet_suggestion_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_suggestion_expires ON wallet_suggestion_cache(expires_at);

CREATE OR REPLACE FUNCTION calc_distance(
  lat1 DECIMAL, lon1 DECIMAL,
  lat2 DECIMAL, lon2 DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
  RETURN 6371 * acos(
    COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
    COS(RADIANS(lon2) - RADIANS(lon1)) +
    SIN(RADIANS(lat1)) * SIN(RADIANS(lat2))
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION find_properties_within_radius(
  center_lat DECIMAL,
  center_lon DECIMAL,
  radius_km DECIMAL
)
RETURNS TABLE(
  id UUID,
  title VARCHAR,
  distance_km DECIMAL,
  monthly_rent INTEGER,
  bedrooms INTEGER,
  city VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    calc_distance(center_lat, center_lon, p.latitude, p.longitude) AS distance_km,
    p.monthly_rent,
    p.bedrooms,
    p.city
  FROM properties p
  WHERE p.is_available = true
    AND calc_distance(center_lat, center_lon, p.latitude, p.longitude) <= radius_km
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_commission(p_user_id UUID, amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_tier user_tier;
  v_rate DECIMAL;
BEGIN
  SELECT users.user_tier INTO v_tier FROM users WHERE id = p_user_id;

  IF v_tier = 'enterprise' THEN
    v_rate := 3.5;
  ELSE
    v_rate := 5.0;
  END IF;

  RETURN (amount * v_rate / 100)::INTEGER;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_reference(prefix TEXT DEFAULT 'TRX')
RETURNS TEXT AS $$
BEGIN
  RETURN prefix || '_' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || '_' ||
         LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION one_tap_logistics_booking(
  p_user_id UUID,
  p_service_type VARCHAR,
  p_pickup_address TEXT,
  p_dropoff_address TEXT,
  p_preferred_date DATE
)
RETURNS UUID AS $$
DECLARE
  v_booking_id UUID;
  v_base_price INTEGER;
BEGIN
  SELECT base_price INTO v_base_price
  FROM logistics_service_types
  WHERE name ILIKE '%' || p_service_type || '%'
  LIMIT 1;

  IF v_base_price IS NULL THEN
    v_base_price := 4500000;
  END IF;

  INSERT INTO logistics_bookings (
    user_id,
    service_type,
    pickup_address,
    dropoff_address,
    preferred_date,
    base_price,
    total_price,
    status
  ) VALUES (
    p_user_id,
    p_service_type,
    p_pickup_address,
    p_dropoff_address,
    p_preferred_date,
    v_base_price,
    v_base_price,
    'pending'
  ) RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_owner_rating_on_maintenance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE owner_ratings SET
      pending_maintenance_count = GREATEST(0, pending_maintenance_count - 1),
      completed_maintenance_count = completed_maintenance_count + 1,
      updated_at = NOW()
    WHERE owner_id = NEW.owner_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_owner_rating ON maintenance_requests;
CREATE TRIGGER trigger_update_owner_rating
  AFTER UPDATE ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_owner_rating_on_maintenance();

CREATE OR REPLACE FUNCTION auto_relist_property()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = false AND OLD.is_active = true THEN
    UPDATE properties
    SET is_available = true, updated_at = NOW()
    WHERE id = NEW.property_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_relist ON leases;
CREATE TRIGGER trigger_auto_relist
  AFTER UPDATE ON leases
  FOR EACH ROW
  WHEN (OLD.is_active = true AND NEW.is_active = false)
  EXECUTE FUNCTION auto_relist_property();

CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE users SET wallet_balance = wallet_balance - NEW.amount
    WHERE id = NEW.payer_id;

    IF NEW.payee_id IS NOT NULL THEN
      UPDATE users SET wallet_balance = wallet_balance + NEW.net_amount
      WHERE id = NEW.payee_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_wallet ON transactions;
CREATE TRIGGER trigger_update_wallet
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_balance();

DROP MATERIALIZED VIEW IF EXISTS owner_dashboard;
CREATE MATERIALIZED VIEW owner_dashboard AS
SELECT
  o.owner_id,
  COUNT(DISTINCT p.id) AS total_properties,
  COUNT(CASE WHEN l.is_active THEN 1 END) AS active_leases,
  COALESCE(SUM(CASE WHEN l.is_active THEN l.monthly_rent ELSE 0 END), 0) AS monthly_revenue,
  COALESCE(AVG(o.overall_rating), 0) AS rating,
  COUNT(CASE WHEN m.status = 'pending' THEN 1 END) AS pending_maintenance
FROM owner_ratings o
LEFT JOIN properties p ON o.owner_id = p.owner_id
LEFT JOIN leases l ON p.id = l.property_id
LEFT JOIN maintenance_requests m ON l.id = m.lease_id
GROUP BY o.owner_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_owner_dashboard ON owner_dashboard(owner_id);

DROP MATERIALIZED VIEW IF EXISTS property_search_rankings;
CREATE MATERIALIZED VIEW property_search_rankings AS
SELECT
  p.id,
  p.owner_id,
  COALESCE(o.search_priority_multiplier, 1) AS priority_multiplier,
  p.view_count,
  p.is_featured,
  p.created_at,
  (COALESCE(o.search_priority_multiplier, 1) * 1000 + p.view_count) AS rank_score
FROM properties p
LEFT JOIN owner_ratings o ON p.owner_id = o.owner_id
WHERE p.is_available = true;

CREATE INDEX IF NOT EXISTS idx_property_rankings ON property_search_rankings(rank_score DESC);

INSERT INTO commission_settings (user_tier, property_type, rate, effective_from)
SELECT seed.user_tier, seed.property_type, seed.rate, seed.effective_from
FROM (
  VALUES
    ('free'::user_tier, 'rent', 5.00::DECIMAL(3, 2), DATE '2026-01-01'),
    ('free'::user_tier, 'sale', 3.00::DECIMAL(3, 2), DATE '2026-01-01'),
    ('free'::user_tier, 'fractional', 5.00::DECIMAL(3, 2), DATE '2026-01-01'),
    ('enterprise'::user_tier, 'rent', 3.50::DECIMAL(3, 2), DATE '2026-01-01'),
    ('enterprise'::user_tier, 'sale', 2.00::DECIMAL(3, 2), DATE '2026-01-01'),
    ('enterprise'::user_tier, 'fractional', 4.00::DECIMAL(3, 2), DATE '2026-01-01')
) AS seed(user_tier, property_type, rate, effective_from)
WHERE NOT EXISTS (
  SELECT 1
  FROM commission_settings cs
  WHERE cs.user_tier = seed.user_tier
    AND cs.property_type = seed.property_type
    AND cs.effective_from = seed.effective_from
);

INSERT INTO logistics_service_types (name, description, base_price, estimated_minutes, includes_workers)
SELECT seed.name, seed.description, seed.base_price, seed.estimated_minutes, seed.includes_workers
FROM (
  VALUES
    ('Van + 2 Movers', 'Professional moving van with 2 experienced movers', 4500000, 120, 2),
    ('Boxes Delivery (10 boxes)', 'Fast delivery for up to 10 boxes', 1200000, 60, 0),
    ('Premium Moving (Van + 4 Movers)', 'Large van with 4 movers', 8500000, 180, 4)
) AS seed(name, description, base_price, estimated_minutes, includes_workers)
WHERE NOT EXISTS (
  SELECT 1
  FROM logistics_service_types lst
  WHERE lst.name = seed.name
);
