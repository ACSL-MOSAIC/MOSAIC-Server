package com.gistacsl.mosaic.occupancy_map.dto;

import java.util.List;

public class OccupancyMapListDto {

    public record Res(
            List<OccupancyMapDto.Res> data,
            Integer count
    ) {
    }
}