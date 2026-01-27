package com.gistacsl.mosaic.occupancymap.dto;

import java.util.List;

public class OccupancyMapListDto {

    public record Res(
            List<OccupancyMapDto.Res> data,
            Integer count
    ) {
    }
}