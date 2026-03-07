-- ============================================================================
-- Table: key_pair
-- Description: Cryptographic key pairs for various purposes (JWT, encryption, etc.)
-- ============================================================================
CREATE TABLE key_pair
(
    pk                     UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    purpose                VARCHAR(50)              NOT NULL UNIQUE,
    algorithm              VARCHAR(20)              NOT NULL DEFAULT 'RSA',
    key_size               INTEGER                  NOT NULL DEFAULT 2048,
    public_key             TEXT                     NOT NULL,
    encrypted_private_key  TEXT                     NOT NULL,
    created_at             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);