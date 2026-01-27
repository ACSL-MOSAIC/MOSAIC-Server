package com.gistacsl.mosaic.organization.user.dto;

public class UserCreateDto {

    public record Req(
            String email,
            String password,
            String fullName,
            Boolean isVerified
    ) {
    }
}