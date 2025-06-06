export class DataStore<T> {
    robotId: string
    data: T[] = []
    maxSize: number = 1000
    parser: (data: string) => T
    private subscribers: ((data: T) => void)[] = []

    constructor(robotId: string, maxSize: number = 1000, parser: (data: string) => T) {
        this.maxSize = maxSize
        this.robotId = robotId
        this.parser = parser
    }

    add(data: string) {
        const parsedData = this.parser(data)
        console.log(parsedData)
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