package com.gistacsl.mosaic.dashboard;

import com.gistacsl.mosaic.common.dto.MessageDto;
import com.gistacsl.mosaic.dashboard.dto.TabConfigDto;
import com.gistacsl.mosaic.dashboard.dto.TabConfigUpdateDto;
import com.gistacsl.mosaic.dashboard.dto.TabAddDto;
import com.gistacsl.mosaic.dashboard.dto.TabInfoDto;
import com.gistacsl.mosaic.dashboard.dto.TabNameUpdateDto;
import com.gistacsl.mosaic.repository.TabRepository;
import com.gistacsl.mosaic.repository.entity.TabEntity;
import com.gistacsl.mosaic.security.authentication.UserAuth;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {
    private final DSLContext dslContext;
    private final TabRepository tabRepository;

    public Mono<List<TabInfoDto.Res>> listTabs(UserAuth userAuth) {
        return tabRepository.findAllByOrganizationFkWithoutConfig(userAuth.getOrganizationPk(), dslContext)
                .map(tabEntity -> new TabInfoDto.Res(
                        tabEntity.getPk(),
                        tabEntity.getName()
                ))
                .collectList();
    }

    public Mono<MessageDto> addTab(UserAuth userAuth, TabAddDto.Req req) {
        return Mono.from(dslContext.transactionPublisher(configuration -> {
            DSLContext txContext = configuration.dsl();

            TabEntity newTab = TabEntity.builder()
                    .pk(UUID.randomUUID())
                    .organizationFk(userAuth.getOrganizationPk())
                    .name(req.name())
                    .build();
            return tabRepository.insertTab(newTab, txContext);
        })).map(pk -> new MessageDto("Tab add successfully"));
    }

    public Mono<TabConfigDto.Res> getTabConfig(UserAuth userAuth, UUID tabPk) {
        return Mono.from(tabRepository.findByPkAndOrganizationFk(tabPk, userAuth.getOrganizationPk(), dslContext))
                .map(tabEntity -> new TabConfigDto.Res(
                        tabEntity.getPk(),
                        tabEntity.getName(),
                        tabEntity.getTabConfig()
                ));
    }

    public Mono<MessageDto> updateTabName(UserAuth userAuth, UUID tabPk, TabNameUpdateDto.Req req) {
        return Mono.from(dslContext.transactionPublisher(configuration -> {
            DSLContext txContext = configuration.dsl();

            return tabRepository.updateTabName(
                    tabPk,
                    userAuth.getOrganizationPk(),
                    req.name(),
                    txContext
            );
        })).map(count -> new MessageDto("Tab name updated successfully"));
    }

    public Mono<MessageDto> updateTabConfig(UserAuth userAuth, UUID tabPk, TabConfigUpdateDto.Req req) {
        return Mono.from(dslContext.transactionPublisher(configuration -> {
            DSLContext txContext = configuration.dsl();

            return tabRepository.updateTabName(
                    tabPk,
                    userAuth.getOrganizationPk(),
                    req.tabConfig(),
                    txContext
            );
        })).map(count -> new MessageDto("Tab name updated successfully"));
    }

    public Mono<MessageDto> deleteTab(UserAuth userAuth, UUID tabPk) {
        return Mono.from(dslContext.transactionPublisher(configuration -> {
            DSLContext txContext = configuration.dsl();

            return tabRepository.deleteByPkAndOrganizationFk(
                    tabPk,
                    userAuth.getOrganizationPk(),
                    txContext
            );
        })).map(count -> new MessageDto("Tab deleted successfully"));
    }
}