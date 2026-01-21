package com.gistacsl.mosaic.common;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.Module;
import com.fasterxml.jackson.databind.module.SimpleDeserializers;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.enumerate.SerializableEnum;
import com.gistacsl.mosaic.common.exception.CustomRuntimeException;

import java.io.IOException;

public class ObjectMapperModule {

    public static Module getEnumModule() {
        SimpleModule enumModule = new SimpleModule();
        enumModule.addSerializer(SerializableEnum.class, new JsonSerializer<>() {
            @Override
            public void serialize(SerializableEnum value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
                gen.writeNumber(value.getValue());
            }
        });

        enumModule.setDeserializers(new SerializableEnumDeserializer());

        return enumModule;
    }

    private static class SerializableEnumDeserializer extends SimpleDeserializers {
        @Override
        public JsonDeserializer<?> findEnumDeserializer(Class<?> type, DeserializationConfig config, BeanDescription beanDesc) throws JsonMappingException {
            if (SerializableEnum.class.isAssignableFrom(type) && type.isEnum()) {
                return new JsonDeserializer<>() {
                    @Override
                    public SerializableEnum deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) throws IOException {
                        int v = jsonParser.getIntValue();
                        for (Enum<?> enumConstant : ((Class<? extends Enum<?>>) type).getEnumConstants()) {
                            SerializableEnum serializableEnum = (SerializableEnum) enumConstant;
                            if (v == serializableEnum.getValue()) {
                                return serializableEnum;
                            }
                        }
                        throw new CustomRuntimeException(ResultCode.INVALID_FORMAT);
                    }
                };
            }
            return super.findEnumDeserializer(type, config, beanDesc);
        }
    }
}
