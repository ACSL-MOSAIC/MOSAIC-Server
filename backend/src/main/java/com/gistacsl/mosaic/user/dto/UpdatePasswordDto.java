package com.gistacsl.mosaic.user.dto;

public class UpdatePasswordDto {

    public record Req(
            String currentPassword,
            String newPassword
    ) {
    }
}