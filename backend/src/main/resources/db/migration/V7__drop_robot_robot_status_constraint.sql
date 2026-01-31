-- ============================================================================
-- Migration: Drop and recreate robot status constraint
-- ============================================================================
ALTER TABLE robot
    DROP CONSTRAINT chk_robot_status;
ALTER TABLE robot
    ADD CONSTRAINT chk_robot_status CHECK (status IN (
                                                      'READY_TO_CONNECT',
                                                      'RTC_CONNECTING',
                                                      'RTC_CONNECTED',
                                                      'RTC_DISCONNECTING',
                                                      'RTC_FAILED',
                                                      'DISCONNECTED',
                                                      'WS_CONNECTED'
        ));