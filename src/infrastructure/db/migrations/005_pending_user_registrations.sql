CREATE TABLE IF NOT EXISTS pending_user_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(15) NOT NULL,
  role account_role NOT NULL DEFAULT 'user',
  password_hash VARCHAR(255) NOT NULL,
  mfa_channel mfa_channel_type NOT NULL DEFAULT 'email',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pending_registrations_email
  ON pending_user_registrations(email)
  WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_pending_registrations_phone
  ON pending_user_registrations(phone);

CREATE INDEX IF NOT EXISTS idx_pending_registrations_expires
  ON pending_user_registrations(expires_at);
