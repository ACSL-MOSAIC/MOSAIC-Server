package com.gistacsl.mosaic.user;

import com.gistacsl.mosaic.common.GResponse;
import com.gistacsl.mosaic.common.dto.MessageDto;
import com.gistacsl.mosaic.security.authentication.UserAuth;
import com.gistacsl.mosaic.user.dto.UpdatePasswordDto;
import com.gistacsl.mosaic.user.dto.UserDto;
import com.gistacsl.mosaic.user.dto.UserUpdateMeDto;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/users/me")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping
    public Mono<GResponse<UserDto.Res>> getCurrentUser() {
        return UserAuth.getUserAuthFromSecurityContextHolder()
                .flatMap(userService::getCurrentUser)
                .map(GResponse::toGResponse);
    }

    @PutMapping
    public Mono<GResponse<MessageDto>> updateCurrentUser(@RequestBody UserUpdateMeDto.Req req) {
        return UserAuth.getUserAuthFromSecurityContextHolder()
                .flatMap(userAuth -> userService.updateCurrentUser(userAuth, req))
                .map(GResponse::toGResponse);
    }

    @PutMapping("/password")
    public Mono<GResponse<MessageDto>> updatePassword(@RequestBody UpdatePasswordDto.Req req) {
        return UserAuth.getUserAuthFromSecurityContextHolder()
                .flatMap(userAuth -> userService.updatePassword(userAuth, req))
                .map(GResponse::toGResponse);
    }
}