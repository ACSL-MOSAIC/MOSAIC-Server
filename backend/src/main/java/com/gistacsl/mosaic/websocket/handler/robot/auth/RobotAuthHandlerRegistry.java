package com.gistacsl.mosaic.websocket.handler.robot.auth;

import java.util.HashMap;
import java.util.Map;

import lombok.extern.slf4j.Slf4j;

import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.robot.enumerate.RobotAuthType;

import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class RobotAuthHandlerRegistry {
  private final Map<RobotAuthType, MosaicBaseAuthHandler> handlerMap;

  public RobotAuthHandlerRegistry(ApplicationContext applicationContext) {
    this.handlerMap = new HashMap<>();

    // Find all beans with @RobotAuthHandler annotation
    Map<String, Object> beans = applicationContext.getBeansWithAnnotation(RobotAuthHandler.class);

    for (Object bean : beans.values()) {
      if (bean instanceof MosaicBaseAuthHandler handler) {
        RobotAuthHandler annotation = bean.getClass().getAnnotation(RobotAuthHandler.class);
        RobotAuthType authType = annotation.value();
        handlerMap.put(authType, handler);
        log.info(
            "Registered RobotAuthHandler: {} for authType: {}",
            handler.getClass().getSimpleName(),
            authType);
      }
    }
  }

  public MosaicBaseAuthHandler getHandler(RobotAuthType authType) throws CustomException {
    MosaicBaseAuthHandler handler = handlerMap.get(authType);
    if (handler == null) {
      throw new CustomException(ResultCode.UNKNOWN_ROBOT_AUTH_TYPE);
    } else {
      return handler;
    }
  }
}
