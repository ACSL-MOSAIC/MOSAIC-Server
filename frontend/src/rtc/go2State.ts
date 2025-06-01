import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Go2LowState } from './types'

export class Go2StateVisualizer {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private robot: THREE.Group
  private motorCharts: { [key: string]: any } = {}
  private footCharts: { [key: string]: any } = {}

  constructor(containerId: string) {
    console.log('[Go2State] 초기화 시작:', containerId)
    
    // Three.js 초기화
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    
    const container = document.getElementById(containerId)
    if (!container) {
      console.error('[Go2State] 컨테이너를 찾을 수 없음:', containerId)
      throw new Error(`Container with id ${containerId} not found`)
    }
    console.log('[Go2State] 컨테이너 크기:', container.clientWidth, 'x', container.clientHeight)

    this.renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(this.renderer.domElement)
    console.log('[Go2State] 렌더러 초기화 완료')

    // 카메라 위치 설정
    this.camera.position.set(0, 2, 3)
    this.camera.lookAt(0, 0, 0)

    // 조명 설정
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    directionalLight.position.set(5, 5, 5)
    this.scene.add(directionalLight)

    // 컨트롤 설정
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05

    // 로봇 모델 생성
    this.robot = new THREE.Group()
    this.createRobotModel()
    this.scene.add(this.robot)
    console.log('[Go2State] 로봇 모델 생성 완료')

    // 애니메이션 시작
    this.animate()
    console.log('[Go2State] 애니메이션 시작')

    // 창 크기 변경 이벤트 처리
    window.addEventListener('resize', this.onWindowResize.bind(this))
    console.log('[Go2State] 초기화 완료')
  }

  private createRobotModel() {
    // 로봇 본체
    const bodyGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.3)
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x2194ce })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    this.robot.add(body)

    // 다리
    const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4)
    const legMaterial = new THREE.MeshPhongMaterial({ color: 0x2194ce })

    // 왼쪽 다리
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial)
    leftLeg.position.set(-0.15, -0.35, 0)
    this.robot.add(leftLeg)

    // 오른쪽 다리
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial)
    rightLeg.position.set(0.15, -0.35, 0)
    this.robot.add(rightLeg)
  }

  private animate() {
    requestAnimationFrame(this.animate.bind(this))
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  private onWindowResize() {
    const container = this.renderer.domElement.parentElement
    if (!container) return

    this.camera.aspect = container.clientWidth / container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(container.clientWidth, container.clientHeight)
  }

  public updateState(state: Go2LowState) {
    console.log('[Go2State] 상태 업데이트:', {
      imu: state.imu,
      motors: Object.keys(state.motors).length,
      footForce: Object.keys(state.footForce).length
    })

    // 로봇 방향 업데이트
    this.robot.rotation.y = state.imu.roll
    this.robot.rotation.x = state.imu.pitch
    console.log('[Go2State] 로봇 방향 업데이트:', {
      roll: state.imu.roll,
      pitch: state.imu.pitch
    })

    // 모터 상태 업데이트
    Object.entries(state.motors).forEach(([motorId, motorState]) => {
      if (!this.motorCharts[motorId]) {
        console.log('[Go2State] 새 모터 차트 생성:', motorId)
        this.createMotorChart(motorId)
      }
      this.updateMotorChart(motorId, motorState)
    })

    // 발 힘 상태 업데이트
    Object.entries(state.footForce).forEach(([footId, force]) => {
      if (!this.footCharts[footId]) {
        console.log('[Go2State] 새 발 힘 차트 생성:', footId)
        this.createFootChart(footId)
      }
      this.updateFootChart(footId, force)
    })
  }

  private createMotorChart(motorId: string) {
    const container = document.getElementById(`motor-chart-${motorId}`)
    if (!container) {
      console.error('[Go2State] 모터 차트 컨테이너를 찾을 수 없음:', motorId)
      return
    }
    console.log('[Go2State] 모터 차트 생성:', motorId)
    // 모터 차트 생성 로직
    this.motorCharts[motorId] = {
      // 차트 초기화
    }
  }

  private updateMotorChart(motorId: string, motorState: any) {
    const chart = this.motorCharts[motorId]
    if (!chart) return

    // 모터 차트 업데이트 로직
  }

  private createFootChart(footId: string) {
    const container = document.getElementById(`foot-chart-${footId}`)
    if (!container) {
      console.error('[Go2State] 발 힘 차트 컨테이너를 찾을 수 없음:', footId)
      return
    }
    console.log('[Go2State] 발 힘 차트 생성:', footId)
    // 발 힘 차트 생성 로직
    this.footCharts[footId] = {
      // 차트 초기화
    }
  }

  private updateFootChart(footId: string, force: number) {
    const chart = this.footCharts[footId]
    if (!chart) return

    // 발 힘 차트 업데이트 로직
  }

  public dispose() {
    console.log('[Go2State] 리소스 정리 시작')
    window.removeEventListener('resize', this.onWindowResize.bind(this))
    this.renderer.dispose()
    this.controls.dispose()
    console.log('[Go2State] 리소스 정리 완료')
  }
} 