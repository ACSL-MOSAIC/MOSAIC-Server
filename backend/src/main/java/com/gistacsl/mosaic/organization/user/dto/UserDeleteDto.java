package com.gistacsl.mosaic.organization.user.dto;

import java.util.UUID;

public class UserDeleteDto {

    public record Req(
            UUID id
    ) {
    }
}