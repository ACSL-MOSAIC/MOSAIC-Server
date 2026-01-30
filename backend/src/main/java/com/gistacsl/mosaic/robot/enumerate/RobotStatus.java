package com.gistacsl.mosaic.robot.enumerate;

import com.gistacsl.mosaic.common.enumerate.SerializableEnum;

public enum RobotStatus implements SerializableEnum {
    READY_TO_CONNECT(0),
    RTC_CONNECTING(1),
    RTC_CONNECTED(2),
    RTC_DISCONNECTING(3),
    RTC_FAILED(4),
    DISCONNECTED(5),
    WS_CONNECTED(6);

    private final int value;

    RobotStatus(int value) {
        this.value = value;
    }

    @Override
    public int getValue() {
        return this.value;
    }
}