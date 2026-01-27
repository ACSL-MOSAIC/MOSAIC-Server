package com.gistacsl.mosaic.occupancy_map;

import com.gistacsl.mosaic.common.GResponse;
import com.gistacsl.mosaic.common.dto.MessageDto;
import com.gistacsl.mosaic.occupancy_map.dto.OccupancyMapDto;
import com.gistacsl.mosaic.occupancy_map.dto.OccupancyMapListDto;
import com.gistacsl.mosaic.occupancy_map.dto.OccupancyMapUpdateDto;
import com.gistacsl.mosaic.security.authentication.UserAuth;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/occupancy_map")
@RequiredArgsConstructor
public class OccupancyMapController {
    private final OccupancyMapService occupancyMapService;

    @GetMapping
    public Mono<GResponse<OccupancyMapListDto.Res>> listOccupancyMaps(
            @RequestParam(defaultValue = "0") int skip,
            @RequestParam(defaultValue = "100") int limit
    ) {
        return UserAuth.getUserAuthFromSecurityContextHolder()
                .flatMap(userAuth -> occupancyMapService.listOccupancyMaps(userAuth, skip, limit))
                .map(GResponse::toGResponse);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<GResponse<OccupancyMapDto.Res>> createOccupancyMap(
            @RequestPart("name") String name,
            @RequestPart("pgm_file") Mono<FilePart> pgmFile,
            @RequestPart("yaml_file") Mono<FilePart> yamlFile
    ) {
        return UserAuth.getUserAuthFromSecurityContextHolder()
                .flatMap(userAuth -> occupancyMapService.createOccupancyMap(userAuth, name, pgmFile, yamlFile))
                .map(GResponse::toGResponse);
    }

    @GetMapping("/{id}")
    public Mono<GResponse<OccupancyMapDto.Res>> getOccupancyMap(@PathVariable UUID id) {
        return UserAuth.getUserAuthFromSecurityContextHolder()
                .flatMap(userAuth -> occupancyMapService.getOccupancyMap(userAuth, id))
                .map(GResponse::toGResponse);
    }

    @PutMapping("/{id}")
    public Mono<GResponse<MessageDto>> updateOccupancyMap(
            @PathVariable UUID id,
            @RequestBody OccupancyMapUpdateDto.Req req
    ) {
        return UserAuth.getUserAuthFromSecurityContextHolder()
                .flatMap(userAuth -> occupancyMapService.updateOccupancyMap(userAuth, id, req))
                .map(GResponse::toGResponse);
    }

    @DeleteMapping("/{id}")
    public Mono<GResponse<MessageDto>> deleteOccupancyMap(@PathVariable UUID id) {
        return UserAuth.getUserAuthFromSecurityContextHolder()
                .flatMap(userAuth -> occupancyMapService.deleteOccupancyMap(userAuth, id))
                .map(GResponse::toGResponse);
    }

    @GetMapping(value = "/{id}/pgm", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public Mono<byte[]> downloadPgmFile(@PathVariable UUID id) {
        return UserAuth.getUserAuthFromSecurityContextHolder()
                .flatMap(userAuth -> occupancyMapService.downloadPgmFile(userAuth, id));
    }

    @GetMapping(value = "/{id}/yaml", produces = "application/x-yaml")
    public Mono<byte[]> downloadYamlFile(@PathVariable UUID id) {
        return UserAuth.getUserAuthFromSecurityContextHolder()
                .flatMap(userAuth -> occupancyMapService.downloadYamlFile(userAuth, id));
    }

    @GetMapping(value = "/{id}/download", produces = "application/zip")
    public Mono<byte[]> downloadMapZip(@PathVariable UUID id) {
        return UserAuth.getUserAuthFromSecurityContextHolder()
                .flatMap(userAuth -> occupancyMapService.downloadMapZip(userAuth, id));
    }
}