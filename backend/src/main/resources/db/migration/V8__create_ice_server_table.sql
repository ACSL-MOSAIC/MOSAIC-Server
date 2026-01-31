-- ============================================================================
-- Table: ice_server
-- Description: ICE (STUN/TURN) servers configuration for WebRTC connections
-- ============================================================================
CREATE TABLE ice_server
(
    pk         UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    urls       VARCHAR(255)             NOT NULL,
    username   VARCHAR(255),
    credential TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
