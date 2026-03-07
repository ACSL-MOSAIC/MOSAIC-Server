package com.gistacsl.mosaic.account.dto;

public class OrganizationLoginDto {

  public record Req(String username, String password, String organizationName) {}

  public record Res(String accessToken, Boolean existingConnection) {}
}
