package com.gistacsl.mosaic.organization.user.dto;

import com.gistacsl.mosaic.user.dto.UserDto;

import java.util.List;

public class UserListDto {

    public record Res(
            List<UserDto.Res> data,
            Integer count
    ) {
    }
}