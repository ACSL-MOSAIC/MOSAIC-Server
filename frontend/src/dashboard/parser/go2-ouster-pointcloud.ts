import { chunking, pointcloud } from './protobuf/proto';
import { ParsedData } from "./parsed.type";


interface ChunkData {
    messageId: string;
    chunks: Map<number, Uint8Array>;
    totalChunks: number;
    timestamp: number;
}

// 전역 chunkMap과 cleanup 타이머
const chunkMap: Map<string, ChunkData> = new Map();
const CHUNK_TIMEOUT = 5000; // 5초

// 주기적으로 오래된 chunk 데이터 정리
setInterval(() => {
    const now = Date.now();
    for (const [messageId, chunkData] of chunkMap.entries()) {
        if (now - chunkData.timestamp > CHUNK_TIMEOUT) {
            chunkMap.delete(messageId);
        }
    }
}, CHUNK_TIMEOUT);

const combineChunks = (chunkData: ChunkData): Uint8Array => {
    const totalSize = Array.from(chunkData.chunks.values())
        .reduce((sum, chunk) => sum + chunk.length, 0);
    
    const combinedData = new Uint8Array(totalSize);
    let offset = 0;

    // chunk들을 순서대로 조합
    for (let i = 0; i < chunkData.totalChunks; i++) {
        const chunk = chunkData.chunks.get(i);
        if (!chunk) {
            throw new Error(`Missing chunk ${i} for message ${chunkData.messageId}`);
        }
        combinedData.set(chunk, offset);
        offset += chunk.length;
    }

    return combinedData;
};

export type ParsedPointCloud2 = ParsedData<pointcloud.IPointCloud2>;

export const parsePointCloud2 = (buffer: ArrayBuffer): ParsedPointCloud2 | null => {
    try {

        const dataChunk = chunking.DataChunk.decode(new Uint8Array(buffer));
        console.log("dataChunk", dataChunk)
        return parsePointCloud2FromDataChunk(dataChunk);
    } catch (error) {
        console.error('Error decoding data chunk:', error);
        return null;
    }
};

export const parsePointCloud2FromDataChunk = (dataChunk: chunking.DataChunk): ParsedPointCloud2 | null => {
    try {
        // 새로운 메시지 ID인 경우 초기화
        if (!chunkMap.has(dataChunk.messageId)) {
            chunkMap.set(dataChunk.messageId, {
                messageId: dataChunk.messageId,
                chunks: new Map(),
                totalChunks: dataChunk.totalChunks,
                timestamp: Date.now()
            });
        }

        const chunkData = chunkMap.get(dataChunk.messageId)!;
        console.log("chunkData", chunkData)
        
        // chunk 저장
        chunkData.chunks.set(dataChunk.chunkIndex, dataChunk.payload);
        chunkData.timestamp = Date.now();

        // 모든 chunk가 도착했는지 확인
        if (chunkData.chunks.size === chunkData.totalChunks) {
            // chunk들을 순서대로 조합
            const combinedData = combineChunks(chunkData);
            console.log("combinedData", combinedData)
            

            // PointCloud2 객체 생성
            const pointCloud = pointcloud.PointCloud2.decode(combinedData);
            
            // 처리된 chunk 데이터 삭제
            chunkMap.delete(dataChunk.messageId);
            
            // PointCloud2 객체를 ParsedPointCloud2로 변환
            const parsedPointCloud: ParsedPointCloud2 = {
                ...pointCloud.toJSON(),
                timestamp: Date.now()
            };
            
            console.log("parsedPointCloud", parsedPointCloud)
            return parsedPointCloud;
        }

        return null;
    } catch (error) {
        console.error('Error parsing data chunk:', error);
        return null;
    }
};

export const GO2_OUSTER_POINTCLOUD2_TYPE = Symbol('go2_ouster_pointcloud2'); 