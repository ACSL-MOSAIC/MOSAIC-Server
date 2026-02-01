package com.gistacsl.mosaic.account;

import com.gistacsl.mosaic.account.dto.LoginDto;
import com.gistacsl.mosaic.account.dto.SignupDto;
import com.gistacsl.mosaic.common.dto.MessageDto;
import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.repository.OrganizationRepository;
import com.gistacsl.mosaic.repository.TabRepository;
import com.gistacsl.mosaic.repository.UserRepository;
import com.gistacsl.mosaic.repository.entity.OrganizationEntity;
import com.gistacsl.mosaic.repository.entity.TabEntity;
import com.gistacsl.mosaic.repository.entity.UserEntity;
import com.gistacsl.mosaic.security.authentication.UserAuth;
import com.gistacsl.mosaic.security.jwt.AccessToken;
import com.gistacsl.mosaic.security.jwt.dto.JwtPayload;
import com.gistacsl.mosaic.websocket.session.UserWsSession;
import com.gistacsl.mosaic.websocket.session.WsSessionManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccountService {
    private final DSLContext dslContext;
    private final PasswordEncoder passwordEncoder;

    private final UserRepository userRepository;
    private final TabRepository tabRepository;
    private final OrganizationRepository organizationRepository;

    private final WsSessionManager wsSessionManager;

    private final AccessToken accessToken;

    public Mono<LoginDto.Res> login(LoginDto.Req req) {
        return userRepository.findByEmail(req.username(), dslContext)
                .switchIfEmpty(Mono.error(new CustomException(ResultCode.USER_NOT_FOUND)))
                .flatMap(user -> {
                    if (!user.getIsActive()) {
                        return Mono.error(new CustomException(ResultCode.USER_NOT_ACTIVE));
                    }

                    if (!passwordEncoder.matches(req.password(), user.getHashedPassword())) {
                        return Mono.error(new CustomException(ResultCode.INVALID_PASSWORD));
                    }

                    JwtPayload jwtPayload = new JwtPayload(
                            user.getPk().toString(),
                            user.getOrganizationFk().toString(),
                            user.getIsOrganizationAdmin() ? "ROLE_ORGANIZATION_ADMIN" : "ROLE_USER"
                    );

                    try {
                        String token = accessToken.issueToken(jwtPayload);
                        return Mono.just(new LoginDto.Res(token, false));
                    } catch (CustomException e) {
                        return Mono.error(e);
                    }
                });
    }

    public Mono<MessageDto> disconnect(UserAuth userAuth) {
        Optional<UserWsSession> optionalUserWsSession = this.wsSessionManager.getUserSessionByUserPk(userAuth.getUserPk());
        if (optionalUserWsSession.isPresent()) {
            UserWsSession userWsSession = optionalUserWsSession.get();
            this.wsSessionManager.removeUserSession(userWsSession.getSessionId());
            return userWsSession.close()
                    .then(Mono.just(new MessageDto("Session disconnected successfully")));
        }
        return Mono.just(new MessageDto("Session disconnected successfully"));
    }

    public Mono<MessageDto> signup(SignupDto.Req req) {
        return userRepository.findByEmail(req.email(), dslContext)
                .flatMap(existingUser -> Mono.<MessageDto>error(
                        new CustomException(ResultCode.USER_ALREADY_EXISTS)))
                .switchIfEmpty(Mono.defer(() -> this.createOrganizationAndUserAndTab(req)));
    }

    private Mono<MessageDto> createOrganizationAndUserAndTab(SignupDto.Req req) {
        OffsetDateTime now = OffsetDateTime.now();

        return Mono.from(dslContext.transactionPublisher(configuration -> {
            DSLContext txContext = configuration.dsl();
            return this.createOrganization(req.email(), now, txContext)
                    .flatMap(organization -> createDefaultTab(organization, now, txContext)
                            .flatMap(tab -> createUser(req, organization, true, now, txContext))
                            .map(user -> new MessageDto("User created successfully")));
        })).thenReturn(new MessageDto("User created successfully"));
    }

    private Mono<OrganizationEntity> createOrganization(String email, OffsetDateTime now, DSLContext txContext) {
        UUID newOrganizationPk = UUID.randomUUID();

        OrganizationEntity newOrganization = OrganizationEntity.builder()
                .pk(newOrganizationPk)
                .name(email)
                .createdAt(now)
                .updatedAt(now)
                .build();

        return organizationRepository.insertOrganization(newOrganization, txContext)
                .map(organizationPk -> newOrganization);
    }

    private Mono<TabEntity> createDefaultTab(OrganizationEntity organization, OffsetDateTime now, DSLContext txContext) {
        UUID newTabPk = UUID.randomUUID();

        TabEntity newTabEntity = TabEntity.builder()
                .pk(newTabPk)
                .organizationFk(organization.getPk())
                .name("Dashboard")
                .createdAt(now)
                .updatedAt(now)
                .build();

        return tabRepository.insertTab(newTabEntity, txContext)
                .map(tabPk -> newTabEntity);
    }

    public Mono<UserEntity> createUser(
            SignupDto.Req req,
            OrganizationEntity organization,
            boolean isOrganizationAdmin,
            OffsetDateTime now,
            DSLContext txContext
    ) {
        UUID newUserPk = UUID.randomUUID();

        UserEntity newUser = UserEntity.builder()
                .pk(newUserPk)
                .organizationFk(organization.getPk())
                .isActive(true)
                .isOrganizationAdmin(isOrganizationAdmin)
                .email(req.email())
                .fullName(req.fullName())
                .hashedPassword(passwordEncoder.encode(req.password()))
                .createdAt(now)
                .updatedAt(now)
                .build();

        return userRepository.insertUser(newUser, txContext)
                .map(userPk -> newUser);
    }
}