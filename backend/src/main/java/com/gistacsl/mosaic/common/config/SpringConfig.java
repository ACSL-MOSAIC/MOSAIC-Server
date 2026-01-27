package com.gistacsl.mosaic.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gistacsl.mosaic.common.ObjectMapperModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SpringConfig {
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
        objectMapper.registerModule(ObjectMapperModule.getEnumModule());

        return objectMapper;
    }
}
