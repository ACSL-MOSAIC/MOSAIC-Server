package com.gistacsl.mosaic.organization.user;

import com.gistacsl.mosaic.common.dto.MessageDto;
import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.organization.user.dto.UserCreateDto;
import com.gistacsl.mosaic.organization.user.dto.UserDeleteDto;
import com.gistacsl.mosaic.organization.user.dto.UserListDto;
import com.gistacsl.mosaic.organization.user.dto.UserUpdateDto;
import com.gistacsl.mosaic.repository.UserRepository;
import com.gistacsl.mosaic.repository.entity.UserEntity;
import com.gistacsl.mosaic.security.authentication.UserAuth;
import com.gistacsl.mosaic.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrganizationUserService {
    private final DSLContext dslContext;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public Mono<UserListDto.Res> listUsers(UserAuth userAuth, int skip, int limit) {
        return userRepository.countByOrganizationFk(userAuth.getOrganizationPk(), dslContext)
                .flatMap(count -> userRepository.findAllByOrganizationFk(
                                userAuth.getOrganizationPk(), skip, limit, dslContext)
                        .map(this::entityToDto)
                        .collectList()
                        .map(users -> new UserListDto.Res(users, count)));
    }

    public Mono<MessageDto> createUser(UserAuth userAuth, UserCreateDto.Req req) {
        return userRepository.findByEmail(req.email(), dslContext)
                .flatMap(existingUser -> Mono.<MessageDto>error(
                        new CustomException(ResultCode.USER_ALREADY_EXISTS)))
                .switchIfEmpty(Mono.defer(() -> {
                    OffsetDateTime now = OffsetDateTime.now();
                    UserEntity user = UserEntity.builder()
                            .pk(UUID.randomUUID())
                            .organizationFk(userAuth.getOrganizationPk())
                            .email(req.email())
                            .fullName(req.fullName())
                            .hashedPassword(passwordEncoder.encode(req.password()))
                            .isActive(true)
                            .isOrganizationAdmin(req.isOrganizationAdmin())
                            .createdAt(now)
                            .updatedAt(now)
                            .build();

                    return userRepository.insertUser(user, dslContext)
                            .map(pk -> new MessageDto("User created successfully"));
                }));
    }

    public Mono<MessageDto> updateUser(UserAuth userAuth, UserUpdateDto.Req req) {
        return userRepository.findByPk(req.id(), dslContext)
                .switchIfEmpty(Mono.error(new CustomException(ResultCode.USER_NOT_FOUND)))
                .flatMap(user -> {
                    if (!user.getOrganizationFk().equals(userAuth.getOrganizationPk())) {
                        return Mono.error(new CustomException(ResultCode.USER_NOT_FOUND));
                    }

                    return userRepository.updateUser(
                            req.id(),
                            userAuth.getOrganizationPk(),
                            req.password() != null ? passwordEncoder.encode(req.password()) : null,
                            req.isActive(),
                            req.isOrganizationAdmin(),
                            req.fullName(),
                            dslContext
                    ).map(count -> new MessageDto("User updated successfully"));
                });
    }

    public Mono<MessageDto> deleteUser(UserAuth userAuth, UserDeleteDto.Req req) {
        if (req.id().equals(userAuth.getUserPk())) {
            return Mono.error(new CustomException(ResultCode.CANNOT_DELETE_YOURSELF));
        }

        return userRepository.findByPk(req.id(), dslContext)
                .switchIfEmpty(Mono.error(new CustomException(ResultCode.USER_NOT_FOUND)))
                .flatMap(user -> {
                    if (!user.getOrganizationFk().equals(userAuth.getOrganizationPk())) {
                        return Mono.error(new CustomException(ResultCode.USER_NOT_FOUND));
                    }

                    return userRepository.deleteByPk(req.id(), dslContext)
                            .map(count -> new MessageDto("User deleted successfully"));
                });
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