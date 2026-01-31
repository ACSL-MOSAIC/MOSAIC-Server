package com.gistacsl.mosaic.ice_server.dto;

public class IceServerDto {

    public record Res(
            String urls,
            String username,
            String credential
    ) {}
}