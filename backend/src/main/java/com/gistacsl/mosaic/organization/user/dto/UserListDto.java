package com.gistacsl.mosaic.organization.user.dto;

import java.util.List;

import com.gistacsl.mosaic.user.dto.UserDto;

public class UserListDto {

  public record Res(List<UserDto.Res> data, Integer count) {}
}
