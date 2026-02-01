package com.gistacsl.mosaic.occupancy_map;

import com.gistacsl.mosaic.common.dto.MessageDto;
import com.gistacsl.mosaic.common.enumerate.ResultCode;
import com.gistacsl.mosaic.common.exception.CustomException;
import com.gistacsl.mosaic.occupancy_map.dto.OccupancyMapDto;
import com.gistacsl.mosaic.occupancy_map.dto.OccupancyMapListDto;
import com.gistacsl.mosaic.repository.OccupancyMapRepository;
import com.gistacsl.mosaic.repository.entity.OccupancyMapEntity;
import com.gistacsl.mosaic.security.authentication.UserAuth;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jooq.DSLContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class OccupancyMapService {
    private final DSLContext dslContext;
    private final OccupancyMapRepository occupancyMapRepository;

    @Value("${file.storage.occupancy-map-path}")
    private String occupancyMapPath;

    public Mono<OccupancyMapListDto.Res> listOccupancyMaps(UserAuth userAuth, int skip, int limit) {
        return occupancyMapRepository.countByOrganizationFk(userAuth.getOrganizationPk(), dslContext)
                .flatMap(count -> occupancyMapRepository.findAllByOrganizationFk(
                                userAuth.getOrganizationPk(), skip, limit, dslContext)
                        .map(this::entityToDto)
                        .collectList()
                        .map(maps -> new OccupancyMapListDto.Res(maps, count)));
    }

    public Mono<MessageDto> createOccupancyMap(
            UserAuth userAuth,
            String name,
            Mono<FilePart> pgmFile,
            Mono<FilePart> yamlFile
    ) {
        return Mono.from(dslContext.transactionPublisher(configuration -> {
            DSLContext txContext = configuration.dsl();

            UUID mapId = UUID.randomUUID();
            String pgmFileName = mapId + ".pgm";
            String yamlFileName = mapId + ".yaml";
            Path pgmPath = Paths.get(occupancyMapPath, pgmFileName);
            Path yamlPath = Paths.get(occupancyMapPath, yamlFileName);

            return saveFile(pgmFile, pgmPath)
                    .then(saveFile(yamlFile, yamlPath))
                    .then(Mono.defer(() -> {
                        OccupancyMapEntity entity = OccupancyMapEntity.builder()
                                .pk(mapId)
                                .organizationFk(userAuth.getOrganizationPk())
                                .name(name)
                                .pgmFilePath(pgmPath.toString())
                                .yamlFilePath(yamlPath.toString())
                                .build();

                        return occupancyMapRepository.insertOccupancyMap(entity, txContext)
                                .map(pk -> new MessageDto("Occupancy map added successfully"));
                    }));
        }));
    }

    public Mono<OccupancyMapDto.Res> getOccupancyMap(UserAuth userAuth, UUID id) {
        return occupancyMapRepository.findByPkAndOrganizationFk(id, userAuth.getOrganizationPk(), dslContext)
                .switchIfEmpty(Mono.error(new CustomException(ResultCode.OCCUPANCY_MAP_NOT_FOUND)))
                .map(this::entityToDto);
    }

    public Mono<MessageDto> deleteOccupancyMap(UserAuth userAuth, UUID id) {
        return Mono.from(dslContext.transactionPublisher(configuration -> {
            DSLContext txContext = configuration.dsl();

            return occupancyMapRepository.findByPkAndOrganizationFk(id, userAuth.getOrganizationPk(), txContext)
                    .switchIfEmpty(Mono.error(new CustomException(ResultCode.OCCUPANCY_MAP_NOT_FOUND)))
                    .flatMap(entity -> {
                        // Delete files
                        return deleteFileIfExists(entity.getPgmFilePath())
                                .then(deleteFileIfExists(entity.getYamlFilePath()))
                                .then(occupancyMapRepository.deleteByPkAndOrganizationFk(
                                        id, userAuth.getOrganizationPk(), txContext))
                                .thenReturn(new MessageDto("Occupancy map deleted successfully"));
                    });
        }));
    }

    public Mono<byte[]> downloadPgmFile(UserAuth userAuth, UUID id) {
        return occupancyMapRepository.findByPkAndOrganizationFk(id, userAuth.getOrganizationPk(), dslContext)
                .switchIfEmpty(Mono.error(new CustomException(ResultCode.OCCUPANCY_MAP_NOT_FOUND)))
                .flatMap(entity -> readFile(entity.getPgmFilePath()));
    }

    public Mono<byte[]> downloadYamlFile(UserAuth userAuth, UUID id) {
        return occupancyMapRepository.findByPkAndOrganizationFk(id, userAuth.getOrganizationPk(), dslContext)
                .switchIfEmpty(Mono.error(new CustomException(ResultCode.OCCUPANCY_MAP_NOT_FOUND)))
                .flatMap(entity -> readFile(entity.getYamlFilePath()));
    }

    public Mono<byte[]> downloadMapZip(UserAuth userAuth, UUID id) {
        return occupancyMapRepository.findByPkAndOrganizationFk(id, userAuth.getOrganizationPk(), dslContext)
                .switchIfEmpty(Mono.error(new CustomException(ResultCode.OCCUPANCY_MAP_NOT_FOUND)))
                .flatMap(entity -> Mono.zip(
                        readFile(entity.getPgmFilePath()),
                        readFile(entity.getYamlFilePath())
                ).flatMap(tuple -> {
                    byte[] pgmBytes = tuple.getT1();
                    byte[] yamlBytes = tuple.getT2();

                    return Mono.fromCallable(() -> {
                        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
                             ZipOutputStream zos = new ZipOutputStream(baos)) {

                            // Add PGM file
                            ZipEntry pgmEntry = new ZipEntry(entity.getName() + ".pgm");
                            zos.putNextEntry(pgmEntry);
                            zos.write(pgmBytes);
                            zos.closeEntry();

                            // Add YAML file
                            ZipEntry yamlEntry = new ZipEntry(entity.getName() + ".yaml");
                            zos.putNextEntry(yamlEntry);
                            zos.write(yamlBytes);
                            zos.closeEntry();

                            zos.finish();
                            return baos.toByteArray();
                        }
                    }).subscribeOn(Schedulers.boundedElastic());
                }));
    }

    private OccupancyMapDto.Res entityToDto(OccupancyMapEntity entity) {
        return new OccupancyMapDto.Res(
                entity.getPk(),
                entity.getName(),
                entity.getPgmFilePath(),
                entity.getYamlFilePath(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private Mono<Void> saveFile(Mono<FilePart> filePart, Path destination) {
        return Mono.fromCallable(() -> {
                    Files.createDirectories(destination.getParent());
                    return destination;
                })
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(path -> filePart.flatMap(fp -> fp.transferTo(path)));
    }

    private Mono<byte[]> readFile(String filePath) {
        return Mono.fromCallable(() -> {
                    Path path = Paths.get(filePath);
                    if (!Files.exists(path)) {
                        throw new CustomException(ResultCode.OCCUPANCY_MAP_NOT_FOUND);
                    }
                    return Files.readAllBytes(path);
                })
                .subscribeOn(Schedulers.boundedElastic());
    }

    private Mono<Void> deleteFileIfExists(String filePath) {
        return Mono.fromCallable(() -> {
                    Path path = Paths.get(filePath);
                    if (Files.exists(path)) {
                        Files.delete(path);
                    }
                    return null;
                })
                .subscribeOn(Schedulers.boundedElastic())
                .then();
    }
}