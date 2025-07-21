import { ParsedData } from "../parser/parsed.type"
import { DataStore } from "../store/store"
import { ReadOnlyStore } from "../store/data-channel-store/readonly/read-only-store"

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
  robotId: string  // 특정 로봇에 종속
  name: string
  schema: JsonSchema
  channelType: 'readonly' | 'writeonly'
  description?: string
  createdAt: number
  updatedAt: number
}

// 동적 타입 관리자
export class DynamicTypeManager {
  private static instance: DynamicTypeManager
  private configs: Map<string, DynamicTypeConfig> = new Map()
  private readonly STORAGE_KEY = 'dynamic_type_configs'

  private constructor() {
    this.loadConfigsFromStorage()
  }

  static getInstance(): DynamicTypeManager {
    if (!DynamicTypeManager.instance) {
      DynamicTypeManager.instance = new DynamicTypeManager()
    }
    return DynamicTypeManager.instance
  }

  // JSON Schema를 TypeScript 인터페이스 문자열로 변환
  private generateTypeScriptInterface(schema: JsonSchema, interfaceName: string): string {
    const generatePropertyType = (propSchema: JsonSchema, propName: string): string => {
      const isRequired = schema.required?.includes(propName) ?? false
      const optionalSuffix = isRequired ? '' : '?'
      
      switch (propSchema.type) {
        case 'string':
          return `string${optionalSuffix}`
        case 'number':
        case 'integer':
          return `number${optionalSuffix}`
        case 'boolean':
          return `boolean${optionalSuffix}`
        case 'array':
          if (propSchema.items) {
            const itemType = generatePropertyType(propSchema.items, 'item')
            return `${itemType}[]${optionalSuffix}`
          }
          return `any[]${optionalSuffix}`
        case 'object':
          if (propSchema.properties) {
            const properties = Object.entries(propSchema.properties)
              .map(([key, value]) => `  ${key}${isRequired ? '' : '?'}: ${generatePropertyType(value, key)}`)
              .join('\n')
            return `{\n${properties}\n}${optionalSuffix}`
          }
          return `Record<string, any>${optionalSuffix}`
        default:
          return `any${optionalSuffix}`
      }
    }

    if (schema.type === 'object' && schema.properties) {
      const properties = Object.entries(schema.properties)
        .map(([key, value]) => `  ${key}${schema.required?.includes(key) ? '' : '?'}: ${generatePropertyType(value, key)}`)
        .join('\n')
      
      return `export interface ${interfaceName} {\n${properties}\n}`
    }

    return `export type ${interfaceName} = any`
  }

  // 동적 파서 함수 생성
  private generateParserFunction(interfaceName: string): string {
    return `
      import { ParsedData } from "../parser/parsed.type"
      
      export type Parsed${interfaceName} = ParsedData<${interfaceName}>
      
      export const parse${interfaceName} = (data: string): Parsed${interfaceName} => {
        const json = JSON.parse(data)
        return {
          ...json,
          timestamp: Date.now()
        }
      }
      
      export const ${interfaceName.toUpperCase()}_TYPE = Symbol('${interfaceName.toLowerCase()}')
    `
  }

  // 동적 스토어 클래스 생성
  private generateStoreClass(interfaceName: string, channelType: 'readonly' | 'writeonly'): string {
    const baseClass = channelType === 'readonly' ? 'ReadOnlyStore' : 'WriteOnlyStore'
    const importPath = channelType === 'readonly' 
      ? '../store/data-channel-store/readonly/read-only-store'
      : '../store/data-channel-store/writeonly/write-only-store'
    
    return `
      import { ${baseClass} } from "${importPath}"
      import { Parsed${interfaceName}, parse${interfaceName} } from "../../parser/dynamic/${interfaceName.toLowerCase()}"
      
      export class ${interfaceName}Store extends ${baseClass}<Parsed${interfaceName}> {
        constructor(robotId: string, maxSize: number = 1000) {
          super(robotId, maxSize, parse${interfaceName})
        }
      }
    `
  }

  // 동적 타입 가드 함수 생성
  private generateTypeGuard(schema: JsonSchema, interfaceName: string): string {
    const generateValidation = (propSchema: JsonSchema, propName: string, path: string): string => {
      const isRequired = schema.required?.includes(propName) ?? false
      
      if (isRequired) {
        return generatePropertyValidation(propSchema, path)
      } else {
        return `
          if (data.${propName} !== undefined) {
            ${generatePropertyValidation(propSchema, path)}
          }
        `
      }
    }

    const generatePropertyValidation = (propSchema: JsonSchema, path: string): string => {
      switch (propSchema.type) {
        case 'string':
          let stringValidation = `if (typeof data.${path} !== 'string') return false;`
          if (propSchema.minLength !== undefined) {
            stringValidation += `\n            if (data.${path}.length < ${propSchema.minLength}) return false;`
          }
          if (propSchema.maxLength !== undefined) {
            stringValidation += `\n            if (data.${path}.length > ${propSchema.maxLength}) return false;`
          }
          if (propSchema.format === 'email') {
            stringValidation += `\n            const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;`
            stringValidation += `\n            if (!emailRegex.test(data.${path})) return false;`
          }
          return stringValidation
          
        case 'number':
        case 'integer':
          let numberValidation = `if (typeof data.${path} !== 'number') return false;`
          if (propSchema.minimum !== undefined) {
            numberValidation += `\n            if (data.${path} < ${propSchema.minimum}) return false;`
          }
          if (propSchema.maximum !== undefined) {
            numberValidation += `\n            if (data.${path} > ${propSchema.maximum}) return false;`
          }
          return numberValidation
          
        case 'boolean':
          return `if (typeof data.${path} !== 'boolean') return false;`
          
        case 'array':
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
            arrayValidation += `\n            }`
          }
          return arrayValidation
          
        case 'object':
          if (propSchema.properties) {
            let objectValidation = `if (typeof data.${path} !== 'object' || data.${path} === null) return false;`
            for (const [key, value] of Object.entries(propSchema.properties)) {
              objectValidation += `\n            ${generateValidation(value, key, `${path}.${key}`)}`
            }
            return objectValidation
          }
          return `if (typeof data.${path} !== 'object' || data.${path} === null) return false;`
          
        default:
          return ''
      }
    }

    if (schema.type === 'object' && schema.properties) {
      let validationCode = `function is${interfaceName}(data: any): data is ${interfaceName} {\n`
      validationCode += `  if (typeof data !== 'object' || data === null) return false;\n`
      
      for (const [key, value] of Object.entries(schema.properties)) {
        validationCode += `  ${generateValidation(value, key, key)}\n`
      }
      
      validationCode += `  return true;\n}`
      return validationCode
    }

    return `function is${interfaceName}(data: any): data is ${interfaceName} { return true; }`
  }

  // 동적 타입 등록
  registerDynamicType(config: Omit<DynamicTypeConfig, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = `dynamic_${config.robotId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = Date.now()
    
    const fullConfig: DynamicTypeConfig = {
      ...config,
      id,
      createdAt: now,
      updatedAt: now
    }

    this.configs.set(id, fullConfig)
    this.saveConfigsToStorage()
    
    return id
  }

  // 동적 파서 생성 및 실행
  createDynamicParser(configId: string): (data: string) => ParsedData<any> {
    const config = this.configs.get(configId)
    if (!config) {
      throw new Error(`Dynamic type config not found: ${configId}`)
    }

    const interfaceName = this.generateInterfaceName(config.name)
    const parserCode = this.generateParserFunction(interfaceName)
    
    // 동적으로 함수 생성
    const parserFunction = new Function('JSON', 'Date', `
      ${parserCode}
      return parse${interfaceName};
    `)
    
    return parserFunction(JSON, Date)
  }

  // 동적 스토어 생성
  createDynamicStore(configId: string, robotId: string, maxSize: number = 1000): DataStore<any, string> {
    const config = this.configs.get(configId)
    if (!config) {
      throw new Error(`Dynamic type config not found: ${configId}`)
    }

    const interfaceName = this.generateInterfaceName(config.name)
    const parser = this.createDynamicParser(configId)
    
    // ReadOnlyStore와 WriteOnlyStore 모두 추상 클래스이므로 DataStore를 직접 사용
    return new DataStore(robotId, maxSize, parser)
  }

  // 타입 가드 생성
  createTypeGuard(configId: string): (data: any) => boolean {
    const config = this.configs.get(configId)
    if (!config) {
      throw new Error(`Dynamic type config not found: ${configId}`)
    }

    const interfaceName = this.generateInterfaceName(config.name)
    const typeGuardCode = this.generateTypeGuard(config.schema, interfaceName)
    
    const typeGuardFunction = new Function('data', `
      ${typeGuardCode}
      return is${interfaceName};
    `)
    
    return typeGuardFunction()
  }

  // 인터페이스 이름 생성
  private generateInterfaceName(name: string): string {
    return name
      .split(/[-_\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
  }

  // 설정 저장
  private saveConfigsToStorage(): void {
    try {
      const configsArray = Array.from(this.configs.values())
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configsArray))
    } catch (error) {
      console.error('Failed to save dynamic type configs to localStorage:', error)
    }
  }

  // 설정 로드
  private loadConfigsFromStorage(): void {
    try {
      const configsJson = localStorage.getItem(this.STORAGE_KEY)
      if (configsJson) {
        const configsArray: DynamicTypeConfig[] = JSON.parse(configsJson)
        this.configs.clear()
        configsArray.forEach(config => {
          this.configs.set(config.id, config)
        })
      }
    } catch (error) {
      console.error('Failed to load dynamic type configs from localStorage:', error)
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
    return Array.from(this.configs.values())
      .filter(config => config.robotId === robotId)
  }

  // 특정 로봇의 특정 이름 설정 조회
  getConfigByRobotAndName(robotId: string, name: string): DynamicTypeConfig | undefined {
    return Array.from(this.configs.values())
      .find(config => config.robotId === robotId && config.name === name)
  }

  // 설정 삭제
  deleteConfig(configId: string): boolean {
    const deleted = this.configs.delete(configId)
    if (deleted) {
      this.saveConfigsToStorage()
    }
    return deleted
  }

  // 특정 로봇의 모든 설정 삭제
  deleteConfigsByRobotId(robotId: string): number {
    const configsToDelete = Array.from(this.configs.entries())
      .filter(([_, config]) => config.robotId === robotId)
    
    configsToDelete.forEach(([id, _]) => {
      this.configs.delete(id)
    })
    
    if (configsToDelete.length > 0) {
      this.saveConfigsToStorage()
    }
    
    return configsToDelete.length
  }

  // 설정 업데이트
  updateConfig(configId: string, updates: Partial<DynamicTypeConfig>): boolean {
    const config = this.configs.get(configId)
    if (!config) {
      return false
    }

    this.configs.set(configId, {
      ...config,
      ...updates,
      updatedAt: Date.now()
    })
    
    this.saveConfigsToStorage()
    return true
  }
}

// 싱글톤 인스턴스 export
export const dynamicTypeManager = DynamicTypeManager.getInstance()
