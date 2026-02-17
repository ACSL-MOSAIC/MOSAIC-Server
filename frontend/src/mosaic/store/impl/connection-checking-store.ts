import {BidirectionalStore} from "@/mosaic/store/interface/bidirectional-store.ts"

export class ConnectionCheckingStore extends BidirectionalStore<void> {
  // 로봇과 연결 상태를 어떻게 주고받을 지 아직 잘 몰라서 일단 ping을 보내면 로봇 쪽에서 pong 보내는 느낌으로 구현함.
  private static readonly PING_INTERVAL_MS = 5000
  private static readonly TIMEOUT_MS = 15000 // 15초 이상 응답 없으면 타임아웃
  private static readonly PING_PAYLOAD = "ping"
  private static readonly PONG_PAYLOAD = "pong"
  public dataType = "connection_check"
  private intervalId: number | null = null
  private lastPongTime: number = Date.now() // 마지막 응답 시간 기록용

  public afterConnected(): void {
    // 연결 시점 초기화
    this.lastPongTime = Date.now()

    // 스스로 구독 시작 -> 로봇 응답 감시
    this.subscribe((data) => this.replyCheck(data))

    this.intervalId = window.setInterval(() => {
      this.connectionCheckInterval()
      this.checkHealth() // 주기적으로 응답 지연 여부 확인
    }, ConnectionCheckingStore.PING_INTERVAL_MS)
  }

  public afterDisconnected(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  public send(data: void): void {
    // no-op
  }

  private connectionCheckInterval(): void {
    this.sendData(ConnectionCheckingStore.PING_PAYLOAD)
  }

  // 응답 지연 여부 판단하는 로직
  private checkHealth(): void {
    const now = Date.now()
    if (now - this.lastPongTime > ConnectionCheckingStore.TIMEOUT_MS) {
      console.warn("Robot is not responding!")
    }
  }

  // 실제 데이터를 수신 -> pong인지 확인
  private async replyCheck(data: ArrayBuffer): Promise<void> {
    const message = new TextDecoder().decode(data)

    if (message === ConnectionCheckingStore.PONG_PAYLOAD) {
      this.lastPongTime = Date.now() // 올바른 응답 시 시간 갱신
    }
  }
}
