import {
  readDynamicTypeConfigApi,
  upsertDynamicTypeConfigApi,
} from "@/client/service/dynamic-type-config.api.ts"
import type { ParsedData } from "../parser/parsed.type"
import { ReadOnlyStore } from "../store/data-channel-store/readonly/read-only-store"
import { ReadOnlyStoreManager } from "../store/data-channel-store/readonly/read-only-store-manager"
import { WriteOnlyStore } from "../store/data-channel-store/writeonly/write-only-store"
import { WriteOnlyStoreManager } from "../store/data-channel-store/writeonly/write-only-store-manager"
import type { DataStore } from "../store/store"

// JSON Schema 타입 정의
export interface JsonSchema {
  type: string
  properties?: Record<string, JsonSchema>
  required?: string[]
  items?: JsonSchema
  minLength?: number
  maxLength?: number
  minimum?: number
  maximum?: number
  format?: string
  minItems?: number
  maxItems?: number
  additionalProperties?: boolean | JsonSchema

  [key: string]: any
}

// 동적 타입 설정
export interface DynamicTypeConfig {
  id: string
  robotId: string // 특정 로봇에 종속
  name: string
  schema: JsonSchema
  channelType: "readonly" | "writeonly"
  channelLabel: string // 채널 라벨 (필수값)
  description?: string
  createdAt: number
  updatedAt: number
}

// 동적 타입 관리자
export class DynamicTypeManager {
  private static instance: DynamicTypeManager
  private configs: Map<string, DynamicTypeConfig> = new Map()
  private dynamicSymbols: Map<string, symbol> = new Map()
  private isLoading = false

  private constructor() {
    // 초기화 시 즉시 로드하지 않고, 필요할 때 로드하도록 변경
  }

  static getInstance(): DynamicTypeManager {
    if (!DynamicTypeManager.instance) {
      DynamicTypeManager.instance = new DynamicTypeManager()
    }
    return DynamicTypeManager.instance
  }

  // 초기화 메서드 추가
  async initialize(): Promise<void> {
    if (this.isLoading) return
    await this.loadConfigsFromAPI()
  }

  // 동적 타입의 Symbol을 생성하고 캐시하는 메서드
  public getDynamicSymbol(robotId: string, typeName: string): symbol {
    const key = `${robotId}__${typeName}`
    if (!this.dynamicSymbols.has(key)) {
      this.dynamicSymbols.set(key, Symbol(`dynamic_${robotId}_${typeName}`))
      // console.log(`DynamicTypeManager: 새로운 동적 Symbol 생성 - ${key}`)
    }
    return this.dynamicSymbols.get(key)!
  }

  // 동적 파서 함수 생성 (import 문 제거)
  private generateParserFunction(interfaceName: string): string {
    return `
      const parse${interfaceName} = (data) => {
        try {
          const json = JSON.parse(data)
          return {
            ...json,
            timestamp: Date.now()
          }
        } catch (error) {
          console.error('Failed to parse ${interfaceName} data:', error)
          return null
        }
      }
    `
  }

  // 동적 타입 가드 함수 생성
  private generateTypeGuard(schema: JsonSchema, interfaceName: string): string {
    const generateValidation = (
      propSchema: JsonSchema,
      propName: string,
      path: string,
    ): string => {
      const isRequired = schema.required?.includes(propName) ?? false

      if (isRequired) {
        return generatePropertyValidation(propSchema, path)
      }
      return `
          if (data.${propName} !== undefined) {
            ${generatePropertyValidation(propSchema, path)}
          }
        `
    }

    const generatePropertyValidation = (
      propSchema: JsonSchema,
      path: string,
    ): string => {
      switch (propSchema.type) {
        case "string": {
          let stringValidation = `if (typeof data.${path} !== 'string') return false;`
          if (propSchema.minLength !== undefined) {
            stringValidation += `\n            if (data.${path}.length < ${propSchema.minLength}) return false;`
          }
          if (propSchema.maxLength !== undefined) {
            stringValidation += `\n            if (data.${path}.length > ${propSchema.maxLength}) return false;`
          }
          if (propSchema.format === "email") {
            stringValidation +=
              "\n            const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;"
            stringValidation += `\n            if (!emailRegex.test(data.${path})) return false;`
          }
          return stringValidation
        }

        case "number":
        case "integer": {
          let numberValidation = `if (typeof data.${path} !== 'number') return false;`
          if (propSchema.minimum !== undefined) {
            numberValidation += `\n            if (data.${path} < ${propSchema.minimum}) return false;`
          }
          if (propSchema.maximum !== undefined) {
            numberValidation += `\n            if (data.${path} > ${propSchema.maximum}) return false;`
          }
          return numberValidation
        }

        case "boolean":
          return `if (typeof data.${path} !== 'boolean') return false;`

        case "array": {
          let arrayValidation = `if (!Array.isArray(data.${path})) return false;`
          if (propSchema.minItems !== undefined) {
            arrayValidation += `\n            if (data.${path}.length < ${propSchema.minItems}) return false;`
          }
          if (propSchema.maxItems !== undefined) {
            arrayValidation += `\n            if (data.${path}.length > ${propSchema.maxItems}) return false;`
          }
          if (propSchema.items) {
            arrayValidation += `\n            for (let i = 0; i < data.${path}.length; i++) {`
            arrayValidation += `\n              ${generatePropertyValidation(propSchema.items, `${path}[i]`)}`
            arrayValidation += "\n            }"
          }
          return arrayValidation
        }

        case "object":
          if (propSchema.properties) {
            let objectValidation = `if (typeof data.${path} !== 'object' || data.${path} === null) return false;`
            for (const [key, value] of Object.entries(propSchema.properties)) {
              objectValidation += `\n            ${generateValidation(value, key, `${path}.${key}`)}`
            }
            return objectValidation
          }
          return `if (typeof data.${path} !== 'object' || data.${path} === null) return false;`

        default:
          return ""
      }
    }

    if (schema.type === "object" && schema.properties) {
      let validationCode = `function is${interfaceName}(data: any): data is ${interfaceName} {\n`
      validationCode += `  if (typeof data !== 'object' || data === null) return false;\n`

      for (const [key, value] of Object.entries(schema.properties)) {
        validationCode += `  ${generateValidation(value, key, key)}\n`
      }

      validationCode += "  return true;\n}"
      return validationCode
    }

    return `function is${interfaceName}(data: any): data is ${interfaceName} { return true; }`
  }

  // 동적 타입 등록
  async registerDynamicType(
    config: Omit<DynamicTypeConfig, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    const id = `dynamic_${config.robotId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = Date.now()

    const fullConfig: DynamicTypeConfig = {
      ...config,
      id,
      createdAt: now,
      updatedAt: now,
    }

    this.configs.set(id, fullConfig)
    await this.saveConfigsToAPI()

    // 타입 등록 시 자동으로 스토어 생성
    try {
      // console.log(
      //   `DynamicTypeManager: 동적 타입 등록 시 스토어 자동 생성 - ${config.name}`,
      // )
      this.createDynamicStore(id, config.robotId)
    } catch (error) {
      console.error(
        `DynamicTypeManager: 동적 타입 등록 시 스토어 생성 실패 - ${config.name}:`,
        error,
      )
    }

    return id
  }

  // 동적 채널 생성 함수
  createDynamicChannel(
    configId: string,
    robotId: string,
    peerConnection: RTCPeerConnection,
  ): RTCDataChannel | null {
    const config = this.configs.get(configId)
    if (!config) {
      console.error(`Dynamic type config not found: ${configId}`)
      return null
    }

    const channelLabel = config.channelLabel

    try {
      // DataChannel 생성
      const dataChannel = peerConnection.createDataChannel(channelLabel, {
        ordered: true,
      })

      // console.log(`DynamicTypeManager: 동적 채널 생성됨 - ${channelLabel}`)

      // 채널 설정 후 스토어 생성
      this.createDynamicStore(configId, robotId)

      return dataChannel
    } catch (error) {
      console.error(
        `DynamicTypeManager: 동적 채널 생성 실패 - ${channelLabel}:`,
        error,
      )
      return null
    }
  }

  // 로봇의 모든 동적 채널 생성
  createAllDynamicChannelsForRobot(
    robotId: string,
    peerConnection: RTCPeerConnection,
  ): RTCDataChannel[] {
    const configs = this.getConfigsByRobotId(robotId)
    const channels: RTCDataChannel[] = []

    // console.log(
    //   `DynamicTypeManager: 로봇 ${robotId}의 ${configs.length}개 동적 채널 생성 시작`,
    // )

    configs.forEach((config) => {
      const channel = this.createDynamicChannel(
        config.id,
        robotId,
        peerConnection,
      )
      if (channel) {
        channels.push(channel)
      }
    })

    return channels
  }

  // 동적 파서 생성 및 실행
  createDynamicParser(configId: string): (data: string) => ParsedData<any> {
    const config = this.configs.get(configId)
    if (!config) {
      throw new Error(`Dynamic type config not found: ${configId}`)
    }

    const interfaceName = this.generateInterfaceName(config.name)
    const parserCode = this.generateParserFunction(interfaceName)

    // 동적으로 함수 생성 (필요한 것들을 매개변수로 전달)
    const parserFunction = new Function(
      "JSON",
      "Date",
      `
      ${parserCode}
      return parse${interfaceName};
    `,
    )

    return parserFunction(JSON, Date)
  }

  // 동적 스토어 생성 및 기존 매니저에 등록
  createDynamicStore(
    configId: string,
    robotId: string,
    maxSize = 1000,
  ): DataStore<any, string> {
    const config = this.configs.get(configId)
    if (!config) {
      throw new Error(`Dynamic type config not found: ${configId}`)
    }

    // 동적 타입 심볼 생성 (캐시된 Symbol 사용)
    const dynamicSymbol = this.getDynamicSymbol(robotId, config.name)

    // 기존 스토어가 있는지 확인
    const existingStore = this.getDynamicStoreFromManager(robotId, config.name)
    if (existingStore) {
      console.log(
        `DynamicTypeManager: 기존 동적 스토어 재사용 - ${config.name}`,
      )
      return existingStore
    }

    const parser = this.createDynamicParser(configId)

    if (config.channelType === "readonly") {
      // ReadOnlyStoreManager를 통해 동적 ReadOnlyStore 생성 및 등록
      const readOnlyManager = ReadOnlyStoreManager.getInstance()
      const store = readOnlyManager.createStoreIfNotExists(
        robotId,
        dynamicSymbol,
        (robotId) => new DynamicReadOnlyStore(robotId, maxSize, parser),
      )

      // 채널 등록
      const channelLabel = config.channelLabel
      readOnlyManager.registerChannelForDataType(
        robotId,
        config.name,
        channelLabel,
      )

      return store
    }
    // WriteOnlyStoreManager를 통해 동적 WriteOnlyStore 생성 및 등록
    const writeOnlyManager = WriteOnlyStoreManager.getInstance()
    const store = writeOnlyManager.createStoreIfNotExists(
      robotId,
      dynamicSymbol,
      (robotId) => new DynamicWriteOnlyStore(robotId, maxSize, parser),
    )

    // 채널 등록
    const channelLabel = config.channelLabel
    writeOnlyManager.registerChannelForDataType(
      robotId,
      config.name,
      channelLabel,
    )

    return store
  }

  // 타입 가드 생성
  createTypeGuard(configId: string): (data: any) => boolean {
    const config = this.configs.get(configId)
    if (!config) {
      throw new Error(`Dynamic type config not found: ${configId}`)
    }

    const interfaceName = this.generateInterfaceName(config.name)
    const typeGuardCode = this.generateTypeGuard(config.schema, interfaceName)

    const typeGuardFunction = new Function(
      "data",
      `
      ${typeGuardCode}
      return is${interfaceName};
    `,
    )

    return typeGuardFunction()
  }

  // 인터페이스 이름 생성
  private generateInterfaceName(name: string): string {
    return name
      .split(/[-_\s]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("")
  }

  // API를 통한 설정 저장
  private async saveConfigsToAPI(): Promise<void> {
    try {
      const configsArray = Array.from(this.configs.values())
      await upsertDynamicTypeConfigApi({ configuration: configsArray as any[] })
      console.log("DynamicTypeManager: 설정이 API를 통해 저장되었습니다.")
    } catch (error) {
      console.error("Failed to save dynamic type configs to API:", error)
    }
  }

  // API를 통한 설정 로드
  private async loadConfigsFromAPI(): Promise<void> {
    if (this.isLoading) return

    this.isLoading = true
    try {
      const response = await readDynamicTypeConfigApi()
      const configsArray: any[] = response.configuration || []

      this.configs.clear()
      configsArray.forEach((config) => {
        this.configs.set(config.id, config as DynamicTypeConfig)
      })

      // 설정 로드 후 모든 동적 스토어 자동 생성
      console.log(
        "DynamicTypeManager: API에서 설정 로드 후 동적 스토어 자동 생성 시작",
      )
      configsArray.forEach((config) => {
        try {
          // 기존 스토어가 있는지 확인
          const existingStore = this.getDynamicStoreFromManager(
            config.robotId,
            config.name,
          )
          if (existingStore) {
            console.log(
              `DynamicTypeManager: 기존 동적 스토어 사용 - ${config.name}`,
            )
          } else {
            console.log(`DynamicTypeManager: 동적 스토어 생성 - ${config.name}`)
            this.createDynamicStore(config.id, config.robotId)
          }
        } catch (error) {
          console.error(
            `DynamicTypeManager: 동적 스토어 생성 실패 - ${config.name}:`,
            error,
          )
        }
      })
    } catch (error) {
      console.error("Failed to load dynamic type configs from API:", error)
      // API 로드 실패 시 빈 설정으로 초기화
      this.configs.clear()
    } finally {
      this.isLoading = false
    }
  }

  // 설정 조회
  getConfig(configId: string): DynamicTypeConfig | undefined {
    return this.configs.get(configId)
  }

  // 모든 설정 조회
  getAllConfigs(): DynamicTypeConfig[] {
    return Array.from(this.configs.values())
  }

  // 특정 로봇의 설정 조회
  getConfigsByRobotId(robotId: string): DynamicTypeConfig[] {
    return Array.from(this.configs.values()).filter(
      (config) => config.robotId === robotId,
    )
  }

  // 특정 로봇의 특정 이름 설정 조회
  getConfigByRobotAndName(
    robotId: string,
    name: string,
  ): DynamicTypeConfig | undefined {
    return Array.from(this.configs.values()).find(
      (config) => config.robotId === robotId && config.name === name,
    )
  }

  // 설정 삭제
  async deleteConfig(configId: string): Promise<boolean> {
    const deleted = this.configs.delete(configId)
    if (deleted) {
      await this.saveConfigsToAPI()
    }
    return deleted
  }

  // 특정 로봇의 모든 설정 삭제
  async deleteConfigsByRobotId(robotId: string): Promise<number> {
    const configsToDelete = Array.from(this.configs.entries()).filter(
      ([_, config]) => config.robotId === robotId,
    )

    configsToDelete.forEach(([id, _]) => {
      this.configs.delete(id)
    })

    if (configsToDelete.length > 0) {
      await this.saveConfigsToAPI()
    }

    return configsToDelete.length
  }

  // 설정 업데이트
  async updateConfig(
    configId: string,
    updates: Partial<DynamicTypeConfig>,
  ): Promise<boolean> {
    const config = this.configs.get(configId)
    if (!config) {
      return false
    }

    this.configs.set(configId, {
      ...config,
      ...updates,
      updatedAt: Date.now(),
    })

    await this.saveConfigsToAPI()
    return true
  }

  // 기존 스토어 매니저에서 동적 스토어 조회 (기존 메서드들과 동일한 방식으로)
  getDynamicStoreFromManager(
    robotId: string,
    typeName: string,
  ): DataStore<any, string> | undefined {
    console.log(
      `DynamicTypeManager: 스토어 찾기 시도 - robotId: ${robotId}, typeName: ${typeName}`,
    )

    const config = this.getConfigByRobotAndName(robotId, typeName)
    if (!config) {
      console.log(
        `DynamicTypeManager: 설정을 찾을 수 없음 - robotId: ${robotId}, typeName: ${typeName}`,
      )
      // 모든 설정 출력해서 디버깅
      const allConfigs = this.getConfigsByRobotId(robotId)
      console.log(
        "DynamicTypeManager: 해당 로봇의 모든 설정:",
        allConfigs.map((c) => ({ name: c.name, channelLabel: c.channelLabel })),
      )
      return undefined
    }

    console.log(
      `DynamicTypeManager: 설정 찾음 - name: ${config.name}, channelLabel: ${config.channelLabel}`,
    )
    const dynamicSymbol = this.getDynamicSymbol(robotId, typeName)

    if (config.channelType === "readonly") {
      const readOnlyManager = ReadOnlyStoreManager.getInstance()
      const store = readOnlyManager.getStore(robotId, dynamicSymbol)
      console.log(
        "DynamicTypeManager: ReadOnly 스토어 찾기 결과:",
        store ? "성공" : "실패",
      )
      return store
    }
    const writeOnlyManager = WriteOnlyStoreManager.getInstance()
    const store = writeOnlyManager.getStore(robotId, dynamicSymbol)
    console.log(
      "DynamicTypeManager: WriteOnly 스토어 찾기 결과:",
      store ? "성공" : "실패",
    )
    return store
  }

  // 로봇의 모든 동적 스토어 조회 (기존 getAllStores와 동일한 방식)
  getAllDynamicStoresForRobot(robotId: string): DataStore<any, string>[] {
    const configs = this.getConfigsByRobotId(robotId)
    const stores: DataStore<any, string>[] = []

    configs.forEach((config) => {
      const store = this.getDynamicStoreFromManager(robotId, config.name)
      if (store) {
        stores.push(store)
      }
    })

    return stores
  }

  // 동적 타입으로 스토어 생성 및 기존 매니저에 완전히 통합
  createAndIntegrateDynamicStore(
    configId: string,
    robotId: string,
    maxSize = 1000,
  ): DataStore<any, string> {
    // 이미 생성된 스토어가 있는지 확인
    const config = this.getConfig(configId)
    if (!config) {
      throw new Error(`Dynamic type config not found: ${configId}`)
    }

    const existingStore = this.getDynamicStoreFromManager(robotId, config.name)
    if (existingStore) {
      return existingStore
    }

    // 새로 생성하고 기존 매니저에 등록
    return this.createDynamicStore(configId, robotId, maxSize)
  }

  // 설정 새로고침 (API에서 다시 로드)
  async refreshConfigs(): Promise<void> {
    await this.loadConfigsFromAPI()
  }
}

// 동적 ReadOnlyStore 구현체
class DynamicReadOnlyStore extends ReadOnlyStore<any, string> {}

// 동적 WriteOnlyStore 구현체
class DynamicWriteOnlyStore extends WriteOnlyStore<any, string> {
  protected sendData(data: any): void {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      console.log("[DynamicWriteOnlyStore] 데이터 전송:", data)
      this.dataChannel.send(JSON.stringify(data))
    }
  }
}

// 싱글톤 인스턴스 export
export const dynamicTypeManager = DynamicTypeManager.getInstance()
