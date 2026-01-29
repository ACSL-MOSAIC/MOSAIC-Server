package com.gistacsl.mosaic.robot.enumerate;

import com.gistacsl.mosaic.common.enumerate.SerializableEnum;

public enum RobotAuthType implements SerializableEnum {
    NO_AUTHORIZATION(0),
    SIMPLE_TOKEN(1);

    private final int value;

    RobotAuthType(int value) {
        this.value = value;
    }

    @Override
    public int getValue() {
        return this.value;
    }
}