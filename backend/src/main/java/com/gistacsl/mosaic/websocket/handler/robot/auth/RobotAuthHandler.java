package com.gistacsl.mosaic.websocket.handler.robot.auth;

import com.gistacsl.mosaic.robot.enumerate.RobotAuthType;
import org.springframework.stereotype.Component;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Component
public @interface RobotAuthHandler {
    RobotAuthType value();
}