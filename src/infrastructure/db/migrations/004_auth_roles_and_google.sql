CREATE TYPE account_role_next AS ENUM ('user', 'property_owner', 'agent', 'admin');

ALTER TABLE users
  ALTER COLUMN role DROP DEFAULT;

ALTER TABLE users
  ALTER COLUMN role TYPE account_role_next
  USING (
    CASE role::TEXT
      WHEN 'tenant' THEN 'user'
      WHEN 'owner' THEN 'property_owner'
      ELSE role::TEXT
    END
  )::account_role_next;

DROP TYPE account_role;

ALTER TYPE account_role_next RENAME TO account_role;

ALTER TABLE users
  ALTER COLUMN role SET DEFAULT 'user'::account_role,
  ADD COLUMN IF NOT EXISTS google_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS last_auth_provider VARCHAR(30) DEFAULT 'password';

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
