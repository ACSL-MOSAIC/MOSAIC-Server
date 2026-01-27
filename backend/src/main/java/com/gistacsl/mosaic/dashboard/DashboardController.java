package com.gistacsl.mosaic.dashboard;

import com.gistacsl.mosaic.common.GResponse;
import com.gistacsl.mosaic.common.dto.MessageDto;
import com.gistacsl.mosaic.dashboard.dto.TabConfigDto;
import com.gistacsl.mosaic.dashboard.dto.TabConfigUpdateDto;
import com.gistacsl.mosaic.dashboard.dto.TabAddDto;
import com.gistacsl.mosaic.dashboard.dto.TabInfoDto;
import com.gistacsl.mosaic.dashboard.dto.TabNameUpdateDto;
import com.gistacsl.mosaic.security.authentication.UserAuth;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dashboard/tabs")
@RequiredArgsConstructor
public class DashboardController {
    private final DashboardService dashboardService;

    @GetMapping
    public Mono<GResponse<List<TabInfoDto.Res>>> listTabs() {
        return UserAuth.getUserAuthFromSecurityContextHolder()
                .flatMap(dashboardService::listTabs)
                .map(GResponse::toGResponse);
    }

    @PostMapping
    public Mono<GResponse<MessageDto>> addTab(@RequestBody TabAddDto.Req req) {
        return UserAuth.getUserAuthFromSecurityContextHolder()
                .flatMap(userAuth -> dashboardService.addTab(userAuth, req))
                .map(GResponse::toGResponse);
    }

    @GetMapping("/{tabId}")
    public Mono<GResponse<TabConfigDto.Res>> getTabConfig(@PathVariable UUID tabId) {
        return UserAuth.getUserAuthFromSecurityContextHolder()
                .flatMap(userAuth -> dashboardService.getTabConfig(userAuth, tabId))
                .map(GResponse::toGResponse);
    }

    @PutMapping("/{tabId}")
    public Mono<GResponse<MessageDto>> updateTabName(
            @PathVariable UUID tabId,
            @RequestBody TabNameUpdateDto.Req req
    ) {
        return UserAuth.getUserAuthFromSecurityContextHolder()
                .flatMap(userAuth -> dashboardService.updateTabName(userAuth, tabId, req))
                .map(GResponse::toGResponse);
    }

    @PutMapping("/{tabId}/configs")
    public Mono<GResponse<MessageDto>> updateTabConfig(
            @PathVariable UUID tabId,
            @RequestBody TabConfigUpdateDto.Req req
    ) {
        return UserAuth.getUserAuthFromSecurityContextHolder()
                .flatMap(userAuth -> dashboardService.updateTabConfig(userAuth, tabId, req))
                .map(GResponse::toGResponse);
    }

    @DeleteMapping("/{tabId}")
    public Mono<GResponse<MessageDto>> deleteTab(@PathVariable UUID tabId) {
        return UserAuth.getUserAuthFromSecurityContextHolder()
                .flatMap(userAuth -> dashboardService.deleteTab(userAuth, tabId))
                .map(GResponse::toGResponse);
    }
}