-- ============================================================================
-- Migration: Make users.organization_fk NOT NULL
-- Description: All users must belong to an organization
-- ============================================================================

-- Alter the column to NOT NULL
ALTER TABLE users
    ALTER COLUMN organization_fk SET NOT NULL;
