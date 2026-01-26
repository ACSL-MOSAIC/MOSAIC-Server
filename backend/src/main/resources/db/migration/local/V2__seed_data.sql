-- ============================================================================
-- Seed Data for Local Development
-- ============================================================================

-- Insert sample organizationPk
INSERT INTO organization (pk, name, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'Sample Organization', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert sample users
INSERT INTO users (pk, organization_fk, is_active, is_organization_admin, email, full_name, hashed_password, created_at,
                   updated_at)
VALUES ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', TRUE, TRUE,
        'admin@example.com', 'Admin User',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password: password
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', TRUE, FALSE,
        'user@example.com', 'Regular User',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password: password
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert sample robots
INSERT INTO robot (pk, organization_fk, status, name, description, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001',
        'DISCONNECTED', 'Robot-001', 'Sample robot for testing', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001',
        'READY_TO_CONNECT', 'Robot-002', 'Another sample robot', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert sample tabs
INSERT INTO tab (pk, organization_fk, name, tab_config, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000001',
        'Main Dashboard', '{
    "widgets": []
  }', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000001',
        'Monitoring', '{
         "widgets": []
       }', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert sample dynamic type config
INSERT INTO dynamic_type_config (organization_fk, configuration, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000001', '[]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);