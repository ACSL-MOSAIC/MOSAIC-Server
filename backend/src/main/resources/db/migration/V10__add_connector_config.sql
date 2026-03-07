-- ============================================================================
-- Add connector_config column to robot table
-- ============================================================================
ALTER TABLE robot
    ADD COLUMN connector_config JSONB;

-- Update existing robots with their connector config
UPDATE robot
SET connector_config = jsonb_build_object('id', pk::text, 'connectors', '[]'::jsonb);

-- Make the column NOT NULL after setting values
ALTER TABLE robot
    ALTER COLUMN connector_config SET NOT NULL;
