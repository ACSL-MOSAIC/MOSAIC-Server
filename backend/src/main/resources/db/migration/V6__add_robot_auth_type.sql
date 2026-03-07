-- ============================================================================
-- Add auth_type column to robot table
-- ============================================================================
ALTER TABLE robot
    ADD COLUMN auth_type VARCHAR(50) NOT NULL DEFAULT 'NO_AUTHORIZATION';

ALTER TABLE robot
    ADD CONSTRAINT chk_robot_auth_type CHECK (auth_type IN (
        'NO_AUTHORIZATION',
        'SIMPLE_TOKEN'
    ));