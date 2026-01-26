package com.gistacsl.mosaic.robot.enumerate;

import com.gistacsl.mosaic.common.enumerate.SerializableEnum;

public enum RobotStatus implements SerializableEnum {
    READY_TO_CONNECT(0),
    CONNECTING(1),
    CONNECTED(2),
    DISCONNECTING(3),
    FAILED(4),
    SHUTTING_DOWN(5),
    DISCONNECTED(6),
    REMOVED(7);

    private final int value;

    RobotStatus(int value) {
        this.value = value;
    }

    @Override
    public int getValue() {
        return this.value;
    }
}