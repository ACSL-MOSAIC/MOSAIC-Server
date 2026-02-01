package com.gistacsl.mosaic.account.dto;

public class SignupDto {

    public record Req(
            String email,
            String password,
            String fullName
    ) {
    }
}