import { ReadOnlyStore } from './read-only-store'
import { ParsedPointCloud2, parsePointCloud2 } from '../../../parser/go2-ouster-pointcloud'

export class Go2OusterPointCloudStore extends ReadOnlyStore<ParsedPointCloud2, ArrayBuffer> {
    constructor(robotId: string) {
        super(robotId, 100, parsePointCloud2)
    }
} 