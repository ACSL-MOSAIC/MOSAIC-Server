package com.gistacsl.mosaic.user;

import com.gistacsl.mosaic.common.dto.MessageDto;
import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.repository.UserRepository;
import com.gistacsl.mosaic.repository.entity.UserEntity;
import com.gistacsl.mosaic.security.authentication.UserAuth;
import com.gistacsl.mosaic.user.dto.UpdatePasswordDto;
import com.gistacsl.mosaic.user.dto.UserDto;
import com.gistacsl.mosaic.user.dto.UserUpdateMeDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {
    private final DSLContext dslContext;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public Mono<UserDto.Res> getCurrentUser(UserAuth userAuth) {
        return userRepository.findByPk(userAuth.getUserPk(), dslContext)
                .switchIfEmpty(Mono.error(new CustomException(ResultCode.USER_NOT_FOUND)))
                .map(this::entityToDto);
    }

    public Mono<MessageDto> updateCurrentUser(UserAuth userAuth, UserUpdateMeDto.Req req) {
        return userRepository.findByPk(userAuth.getUserPk(), dslContext)
                .switchIfEmpty(Mono.error(new CustomException(ResultCode.USER_NOT_FOUND)))
                .flatMap(user -> userRepository.updateFullName(
                        userAuth.getUserPk(),
                        req.fullName(),
                        dslContext
                ))
                .map(count -> new MessageDto("User updated successfully"));
    }

    public Mono<MessageDto> updatePassword(UserAuth userAuth, UpdatePasswordDto.Req req) {
        return userRepository.findByPk(userAuth.getUserPk(), dslContext)
                .switchIfEmpty(Mono.error(new CustomException(ResultCode.USER_NOT_FOUND)))
                .flatMap(user -> {
                    if (!passwordEncoder.matches(req.currentPassword(), user.getHashedPassword())) {
                        return Mono.error(new CustomException(ResultCode.INVALID_PASSWORD));
                    }

                    String newHashedPassword = passwordEncoder.encode(req.newPassword());
                    return userRepository.updatePassword(
                            userAuth.getUserPk(),
                            newHashedPassword,
                            dslContext
                    );
                })
                .map(count -> new MessageDto("Password updated successfully"));
    }

    private UserDto.Res entityToDto(UserEntity entity) {
        return new UserDto.Res(
                entity.getPk(),
                entity.getEmail(),
                entity.getIsActive(),
                entity.getIsOrganizationAdmin(),
                entity.getFullName(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}