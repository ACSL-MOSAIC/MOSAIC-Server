export class DataStore<T, I = string> {
    robotId: string
    data: T[] = []
    maxSize: number = 1000
    parser: (data: I) => T | null
    private subscribers: ((data: T) => void)[] = []

    constructor(robotId: string, maxSize: number = 1000, parser: (data: I) => T | null) {
        this.maxSize = maxSize
        this.robotId = robotId
        this.parser = parser
    }

    add(data: I) {
        // 데이터 수신 로그 추가
        console.log(`📦 DataStore[${this.robotId}] received data:`, {
            dataType: typeof data,
            dataSize: data instanceof ArrayBuffer ? data.byteLength : 'unknown',
            timestamp: new Date().toISOString()
        });

        const parsedData = this.parser(data)

        if (parsedData === null) {
            // null 반환은 파싱 실패가 아니라 아직 완성되지 않은 데이터일 수 있음
            console.log(`⏳ DataStore[${this.robotId}] data not yet complete (waiting for more chunks)`)
            return
        }

        console.log(`✅ DataStore[${this.robotId}] data parsed successfully:`, {
            parsedDataType: typeof parsedData,
            timestamp: new Date().toISOString()
        });

        this.data.push(parsedData)
        if (this.data.length > this.maxSize) {
            this.data.shift()
        }
        
        this.subscribers.forEach(subscriber => subscriber(parsedData))
    }

    subscribe(callback: (data: T) => void) {
        this.subscribers.push(callback)

        if (this.data.length > 0) {
            callback(this.getLast())
        }

        return () => {
            this.subscribers = this.subscribers.filter(sub => sub !== callback)
        }
    }

    get(index: number) {
        return this.data[index]
    }

    getLast() {
        return this.data[this.data.length - 1]
    }

    isFull() {
        return this.data.length >= this.maxSize
    }
}