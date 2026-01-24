-- ============================================================================
-- Table: organization
-- Description: Organizations that users belong to
-- ============================================================================
CREATE TABLE organization
(
    pk         UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    name       VARCHAR(255)             NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_organization_name ON organization (name);

-- ============================================================================
-- Table: users
-- Description: User accounts and authentication
-- ============================================================================
CREATE TABLE users
(
    pk                      UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    organization_fk         UUID,
    is_active               BOOLEAN                  NOT NULL DEFAULT TRUE,
    is_organization_admin   BOOLEAN                  NOT NULL DEFAULT FALSE,
    email                   VARCHAR(255)             NOT NULL,
    full_name               VARCHAR(255),
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    hashed_password         TEXT                     NOT NULL,

    CONSTRAINT users_organization_email_unique UNIQUE (organization_fk, email),
    CONSTRAINT fk_users_organization FOREIGN KEY (organization_fk)
        REFERENCES organization (pk) ON DELETE SET NULL
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_organization_fk ON users (organization_fk);
CREATE UNIQUE INDEX idx_users_email_unique_when_no_org ON users (email) WHERE organization_fk IS NULL;

-- ============================================================================
-- Table: robot
-- Description: Robot devices owned by organizations
-- ============================================================================
CREATE TABLE robot
(
    pk              UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    organization_fk UUID                     NOT NULL,
    status          VARCHAR(50)              NOT NULL DEFAULT 'DISCONNECTED',
    name            VARCHAR(255)             NOT NULL,
    description     VARCHAR(255),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_robot_organization FOREIGN KEY (organization_fk)
        REFERENCES organization (pk) ON DELETE CASCADE,
    CONSTRAINT chk_robot_status CHECK (status IN (
                                                  'READY_TO_CONNECT',
                                                  'CONNECTING',
                                                  'CONNECTED',
                                                  'DISCONNECTING',
                                                  'FAILED',
                                                  'SHUTTING_DOWN',
                                                  'DISCONNECTED',
                                                  'REMOVED'
        ))
);

CREATE INDEX idx_robot_organization_fk ON robot (organization_fk);

-- ============================================================================
-- Table: occupancy_map
-- Description: Occupancy maps (PGM/YAML files) for robot navigation
-- ============================================================================
CREATE TABLE occupancy_map
(
    pk              UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    organization_fk UUID                     NOT NULL,
    name            VARCHAR(255)             NOT NULL,
    pgm_file_path   VARCHAR(1024)            NOT NULL,
    yaml_file_path  VARCHAR(1024)            NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_occupancy_map_organization FOREIGN KEY (organization_fk)
        REFERENCES organization (pk) ON DELETE CASCADE
);

CREATE INDEX idx_occupancy_map_organization_fk ON occupancy_map (organization_fk);

-- ============================================================================
-- Table: dashboard
-- Description: Organization dashboard
-- ============================================================================
CREATE TABLE dashboard
(
    pk              UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    organization_fk UUID                     NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_dashboard_organization FOREIGN KEY (organization_fk)
        REFERENCES organization (pk) ON DELETE CASCADE
);

CREATE INDEX idx_dashboard_organization_fk ON dashboard (organization_fk);

-- ============================================================================
-- Table: tab
-- Description: Dashboard tabs containing widget configurations
-- ============================================================================
CREATE TABLE tab
(
    pk           UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    dashboard_fk UUID                     NOT NULL,
    name         VARCHAR(255)             NOT NULL,
    tab_config   JSONB                    NOT NULL DEFAULT '{}'::jsonb,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_tab_dashboard FOREIGN KEY (dashboard_fk)
        REFERENCES dashboard (pk) ON DELETE CASCADE
);

CREATE INDEX idx_tab_dashboard_fk ON tab (dashboard_fk);

-- ============================================================================
-- Table: dynamic_type_config
-- Description: Organization-specific dynamic type configuration (JSON array)
-- ============================================================================
CREATE TABLE dynamic_type_config
(
    pk              SERIAL PRIMARY KEY,
    organization_fk UUID                     NOT NULL UNIQUE,
    configuration   JSONB                    NOT NULL DEFAULT '[]'::jsonb,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_dynamic_type_config_organization FOREIGN KEY (organization_fk)
        REFERENCES organization (pk) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_dynamic_type_config_organization_fk ON dynamic_type_config (organization_fk);