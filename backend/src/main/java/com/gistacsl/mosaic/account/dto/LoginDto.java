package com.gistacsl.mosaic.account.dto;

public class LoginDto {

    public record Req(
            String username,
            String password
    ) {
    }

    public record Res(
            String accessToken,
            Boolean existingConnection
    ) {
    }
}
