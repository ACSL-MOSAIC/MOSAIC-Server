package com.gistacsl.mosaic.robot;

import com.gistacsl.mosaic.common.GResponse;
import com.gistacsl.mosaic.common.dto.MessageDto;
import com.gistacsl.mosaic.robot.dto.RobotAddDto;
import com.gistacsl.mosaic.robot.dto.RobotInfoDto;
import com.gistacsl.mosaic.robot.dto.RobotListDto;
import com.gistacsl.mosaic.robot.dto.RobotUpdateDto;
import com.gistacsl.mosaic.security.authentication.UserAuth;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/robots")
@RequiredArgsConstructor
public class RobotController {
    private final RobotService robotService;

    @GetMapping
    public Mono<GResponse<RobotListDto.Res>> listRobots(
            @RequestParam(defaultValue = "0") int skip,
            @RequestParam(defaultValue = "100") int limit
    ) {
        return UserAuth.getUserAuthFromSecurityContextHolder()
                .flatMap(userAuth -> robotService.listRobots(userAuth, skip, limit))
                .map(GResponse::toGResponse);
    }

    @PostMapping
    public Mono<GResponse<MessageDto>> addRobot(@RequestBody RobotAddDto.Req req) {
        return UserAuth.getUserAuthFromSecurityContextHolder()
                .flatMap(userAuth -> robotService.addRobot(userAuth, req))
                .map(GResponse::toGResponse);
    }

    @GetMapping("/{id}")
    public Mono<GResponse<RobotInfoDto.Res>> getRobot(@PathVariable UUID id) {
        return UserAuth.getUserAuthFromSecurityContextHolder()
                .flatMap(userAuth -> robotService.getRobot(userAuth, id))
                .map(GResponse::toGResponse);
    }

    @PutMapping("/{id}")
    public Mono<GResponse<MessageDto>> updateRobot(
            @PathVariable UUID id,
            @RequestBody RobotUpdateDto.Req req
    ) {
        return UserAuth.getUserAuthFromSecurityContextHolder()
                .flatMap(userAuth -> robotService.updateRobot(userAuth, id, req))
                .map(GResponse::toGResponse);
    }

    @DeleteMapping("/{id}")
    public Mono<GResponse<MessageDto>> deleteRobot(@PathVariable UUID id) {
        return UserAuth.getUserAuthFromSecurityContextHolder()
                .flatMap(userAuth -> robotService.deleteRobot(userAuth, id))
                .map(GResponse::toGResponse);
    }
}