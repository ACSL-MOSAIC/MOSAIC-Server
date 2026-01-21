export class DataStore<T, I = string> {
  robotId: string
  data: T[] = []
  maxSize = 1000
  parser: (data: I) => T | null
  private subscribers: ((data: T) => void)[] = []

  constructor(robotId: string, maxSize: number, parser: (data: I) => T | null) {
    this.maxSize = maxSize
    this.robotId = robotId
    this.parser = parser
  }

  add(data: I) {
    const parsedData = this.parser(data)
    if (parsedData === null) {
      return
    }

    this.data.push(parsedData)
    if (this.data.length > this.maxSize) {
      this.data.shift()
    }

    this.subscribers.forEach((subscriber) => subscriber(parsedData))
  }

  subscribe(callback: (data: T) => void) {
    this.subscribers.push(callback)

    if (this.data.length > 0) {
      callback(this.getLast())
    }

    return () => {
      this.subscribers = this.subscribers.filter((sub) => sub !== callback)
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
