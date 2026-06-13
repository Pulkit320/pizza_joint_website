-- ============================================================
-- Migration:    V013__create_token_blacklist.sql
-- Description:  Creates token_blacklist table to store blacklisted JTIs from logged out tokens
-- Affected:     token_blacklist
-- Rollback:     V013__create_token_blacklist.down.sql
-- Author:       Deployment Agent
-- Version:      1.0.0
-- ============================================================

CREATE TABLE token_blacklist (
  jti UUID PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE token_blacklist IS
  'Stores JWT IDs (jti) for logged-out tokens until their natural expiry. Replaces the in-memory Set, which does not persist across serverless function invocations.';

COMMENT ON COLUMN token_blacklist.jti IS 'The unique JWT ID claim of the blacklisted token (UUID)';
COMMENT ON COLUMN token_blacklist.expires_at IS 'The expiration timestamp of the blacklisted token';
COMMENT ON COLUMN token_blacklist.created_at IS 'Timestamp when the token was blacklisted';
