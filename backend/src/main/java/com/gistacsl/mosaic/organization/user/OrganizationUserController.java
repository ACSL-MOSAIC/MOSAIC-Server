package com.gistacsl.mosaic.organization.user;

import com.gistacsl.mosaic.common.GResponse;
import com.gistacsl.mosaic.common.dto.MessageDto;
import com.gistacsl.mosaic.organization.user.dto.UserCreateDto;
import com.gistacsl.mosaic.organization.user.dto.UserDeleteDto;
import com.gistacsl.mosaic.organization.user.dto.UserListDto;
import com.gistacsl.mosaic.organization.user.dto.UserUpdateDto;
import com.gistacsl.mosaic.security.authentication.UserAuth;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/organization/users")
@RequiredArgsConstructor
public class OrganizationUserController {
    private final OrganizationUserService organizationUserService;

    @GetMapping
    public Mono<GResponse<UserListDto.Res>> listUsers(
            @RequestParam(defaultValue = "0") int skip,
            @RequestParam(defaultValue = "100") int limit
    ) {
        return UserAuth.getUserAuthFromSecurityContextHolder()
                .flatMap(userAuth -> organizationUserService.listUsers(userAuth, skip, limit))
                .map(GResponse::toGResponse);
    }

    @PostMapping
    public Mono<GResponse<MessageDto>> createUser(@RequestBody UserCreateDto.Req req) {
        return UserAuth.getUserAuthFromSecurityContextHolder()
                .flatMap(userAuth -> organizationUserService.createUser(userAuth, req))
                .map(GResponse::toGResponse);
    }

    @PutMapping
    public Mono<GResponse<MessageDto>> updateUser(@RequestBody UserUpdateDto.Req req) {
        return UserAuth.getUserAuthFromSecurityContextHolder()
                .flatMap(userAuth -> organizationUserService.updateUser(userAuth, req))
                .map(GResponse::toGResponse);
    }

    @DeleteMapping
    public Mono<GResponse<MessageDto>> deleteUser(@RequestBody UserDeleteDto.Req req) {
        return UserAuth.getUserAuthFromSecurityContextHolder()
                .flatMap(userAuth -> organizationUserService.deleteUser(userAuth, req))
                .map(GResponse::toGResponse);
    }
}