import { DataStore } from './store'

import { ParsedPointCloud2, parsePointCloud2 } from '../parser/go2-ouster-pointcloud'

export class Go2OusterPointCloudStore extends DataStore<ParsedPointCloud2, ArrayBuffer> {
    constructor(robotId: string) {
        super(robotId, 1000, parsePointCloud2)
    }
} 