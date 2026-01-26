package com.gistacsl.mosaic.account.dto;

import java.util.UUID;

public class SignupDto {

    public record Req(
            String email,
            String password,
            String fullName
    ) {}

    public record Res(
            UUID id,
            String email,
            Boolean isActive,
            Boolean isOrganizationAdmin,
            String fullName
    ) {}
}