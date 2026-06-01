ALTER TABLE user_verifications
  ADD COLUMN IF NOT EXISTS provider VARCHAR(50),
  ADD COLUMN IF NOT EXISTS provider_response JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_user_verifications_provider
  ON user_verifications(provider);
