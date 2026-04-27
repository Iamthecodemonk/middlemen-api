ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS security_deposit INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS property_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  claim_amount BIGINT NOT NULL,
  escrow_status transaction_status DEFAULT 'pending',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_claims_property ON property_claims(property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_claims_tenant ON property_claims(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_claims_status ON property_claims(escrow_status, expires_at);
