export class DataStore<T> {
    robotId: string
    data: T[] = []
    maxSize: number = 1000
    parser: (data: string) => T

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