# DataChannel System Documentation

## 1. Architecture and Overview

### 1.1 Overall System Structure

The DataChannel system is built with a layered architecture for real-time bidirectional communication based on WebRTC.

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Layer (Widgets)                       │
├─────────────────────────────────────────────────────────────┤
│                Store Management Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ ReadOnlyStore   │  │ WriteOnlyStore  │                  │
│  │   Manager       │  │   Manager       │                  │
│  └─────────────────┘  └─────────────────┘                  │
├─────────────────────────────────────────────────────────────┤
│                   Store Layer                               │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ ReadOnlyStore   │  │ WriteOnlyStore  │                  │
│  └─────────────────┘  └─────────────────┘                  │
├─────────────────────────────────────────────────────────────┤
│                Connection Layer                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              WebRTCConnection                           │ │
│  │  ┌─────────────┐  ┌─────────────┐                      │ │
│  │  │ DataChannel │  │ DataChannel │                      │ │
│  │  │ (ReadOnly)  │  │ (WriteOnly) │                      │ │
│  │  └─────────────┘  └─────────────┘                      │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                   Robot Layer                               │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Core Components

#### **DataStore (Base Storage)**
- Temporary data storage and management
- Maximum size limit (default: 1000 items)
- Real-time data propagation through subscriber pattern

#### **ReadOnlyStore**
- Read-only store for receiving data from robots
- Multiple DataChannel support
- Connection status monitoring

#### **WriteOnlyStore**
- Write-only store for sending data to robots
- Single DataChannel usage
- Connection status and transmission status monitoring

#### **Store Manager**
- Robot-specific store container management
- Store lifecycle management
- Connection state change callback handling

### 1.3 Data Flow

#### **Read-Only Data Flow**
```
Robot → WebRTC DataChannel → ReadOnlyStore → Widget → UI
```

#### **Write-Only Data Flow**
```
UI → Widget → WriteOnlyStore → WebRTC DataChannel → Robot
```

## 2. Adding Stores, Data Channels, Parsers, and Widgets

### 2.1 Adding New Data Type Parser

#### **2.1.1 Create Parser File**
Create a new parser file in the `frontend/src/dashboard/parser/` directory.

```typescript
// frontend/src/dashboard/parser/my-custom-data.ts
import { ParsedData } from "./parsed.type"

export const MY_CUSTOM_DATA_TYPE = Symbol('my_custom_data')

export interface MyCustomData {
  id: string
  value: number
  timestamp: number
}

export function parseMyCustomData(data: string): ParsedData<MyCustomData> | null {
  try {
    const json = JSON.parse(data)
    return {
      data: {
        id: json.id,
        value: json.value,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    }
  } catch (error) {
    console.error('Failed to parse my custom data:', error)
    return null
  }
}
```

#### **2.1.2 Register Parser Type**
Add the new type to `frontend/src/dashboard/parser/parsed.type.ts`.

```typescript
export interface ParsedData<T> {
  data: T
  timestamp: number
}

// Existing types...
export type ParsedDataType = 
  | ParsedData<Go2LowState>
  | ParsedData<MyCustomData>  // Newly added
  // ...
```

### 2.2 Adding New Store

#### **2.2.1 Create ReadOnly Store**
Create a store file in the `frontend/src/dashboard/store/data-channel-store/readonly/` directory.

```typescript
// frontend/src/dashboard/store/data-channel-store/readonly/my-custom-data.store.ts
import { ReadOnlyStore } from "./read-only-store"
import { parseMyCustomData, MyCustomData } from "../../../parser/my-custom-data"

export class MyCustomDataStore extends ReadOnlyStore<MyCustomData, string> {
  constructor(robotId: string) {
    super(robotId, 1000, parseMyCustomData)
  }
}
```

#### **2.2.2 Create WriteOnly Store**
Create a store file in the `frontend/src/dashboard/store/data-channel-store/writeonly/` directory.

```typescript
// frontend/src/dashboard/store/data-channel-store/writeonly/my-custom-command.store.ts
import { WriteOnlyStore } from "./write-only-store"

export interface MyCustomCommand {
  command: string
  parameters: any[]
}

export class MyCustomCommandStore extends WriteOnlyStore<MyCustomCommand, string> {
  constructor(robotId: string) {
    super(robotId, 1000, (data: string) => {
      try {
        return JSON.parse(data)
      } catch (error) {
        console.error('Failed to parse command:', error)
        return null
      }
    })
  }

  protected sendData(data: MyCustomCommand): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(data))
    }
  }
}
```

### 2.3 Adding New Widget

#### **2.3.1 Create Widget Component**
Create a widget file in the `frontend/src/components/Dashboard/widgets/` directory.

```typescript
// frontend/src/components/Dashboard/widgets/MyCustomDataWidget.tsx
import React, { useEffect, useState } from 'react'
import { Box, Text, VStack } from '@chakra-ui/react'
import { WidgetFrame } from './WidgetFrame'
import { MyCustomDataStore } from '../../../dashboard/store/data-channel-store/readonly/my-custom-data.store'
import { MyCustomData } from '../../../dashboard/parser/my-custom-data'

interface MyCustomDataWidgetProps {
  robotId: string
  store: MyCustomDataStore
  dataType: string
  onRemove?: () => void
}

export function MyCustomDataWidget({ robotId, store, dataType, onRemove }: MyCustomDataWidgetProps) {
  const [data, setData] = useState<MyCustomData | null>(null)

  useEffect(() => {
    const unsubscribe = store.subscribe((newData) => {
      setData(newData)
    })

    return unsubscribe
  }, [store])

  return (
    <WidgetFrame title="My Custom Data" robot_id={robot_id} onRemove={onRemove}>
      <VStack spacing={2} align="stretch">
        <Text fontSize="sm" color="gray.600">
          Robot: {robotId}
        </Text>
        {data ? (
          <Box>
            <Text>ID: {data.id}</Text>
            <Text>Value: {data.value}</Text>
            <Text>Timestamp: {new Date(data.timestamp).toLocaleString()}</Text>
          </Box>
        ) : (
          <Text color="gray.500">No data available</Text>
        )}
      </VStack>
    </WidgetFrame>
  )
}
```

#### **2.3.2 Register in WidgetFactory**
Add the new widget to `frontend/src/components/Dashboard/widgets/WidgetFactory.tsx`.

```typescript
// Add to WidgetFactory.tsx
import { MyCustomDataWidget } from './MyCustomDataWidget'
import { MyCustomDataStore } from '../../../dashboard/store/data-channel-store/readonly/my-custom-data.store'
import { MY_CUSTOM_DATA_TYPE } from '../../../dashboard/parser/my-custom-data'

// Add to switch statement
case 'my_custom_data':
  const myCustomDataStore = readOnlyStoreManager.createStoreIfNotExists(
    robotId,
    MY_CUSTOM_DATA_TYPE,
    (robotId) => new MyCustomDataStore(robotId)
  );
  return <MyCustomDataWidget robotId={robotId} store={myCustomDataStore as MyCustomDataStore} dataType={dataType} onRemove={onRemove} />;
```

### 2.4 Adding Data Channel Configuration

#### **2.4.1 Data Channel Configuration**
Add new channel configuration to `frontend/src/rtc/config/webrtc-datachannel-config.ts`.

```typescript
export const DEFAULT_DATA_CHANNELS: DataChannelConfig[] = [
  // Existing channels...
  {
    label: 'my_custom_data',
    dataType: 'my_custom_data',
    channelType: 'readonly'
  },
  {
    label: 'my_custom_command',
    dataType: 'my_custom_command',
    channelType: 'writeonly'
  }
]
```

#### **2.4.2 Update AddWidgetModal**
Add the new widget type item to widgetTypeCollection in `frontend/src/components/Dashboard/AddWidgetModal.tsx`. 
It makes you able to select the new widget type when adding widgets through the UI.

```typescript
const widgetTypeCollection = createListCollection({
    items: [
      // ... Existing widget types
      { label: "My Custom Data", value: "my_custom_data" }, 
      { label: "My Custom Command", value: "my_custom_command" }
    ],
  })
```

#### **2.4.3 Update createDataChannel Method**
Update the `createDataChannel` method in `frontend/src/rtc/webrtc-utils.ts` to handle the new data channel.

```typescript
export function createDataChannel(
  dataChannel: RTCDataChannel, robotId: string, dataType: string, channelType: "readonly" | "writeonly",
): void {
  // ... other existing code
  switch (channelType) {
    // or case "readonly"
     case "writeonly":
       switch (datatype as any) {
        case "my_custom_command":
         store = readOnlyStoreManager.createStoreIfNotExists(
            robotId,
            channelTypeSymbol,
            (robotId) => new MyCustomCommandStore(robotId),
          )
          break
       }
  }
}
```

## 3. Dynamic DataChannel Management

### 3.1 DynamicTypeManager Overview

`DynamicTypeManager` is a system that dynamically creates and manages new data types and channels at runtime. **Crucially, it is designed as a UI-only system** - dynamic types and stores can **only be created through the user interface**, not programmatically. This makes it accessible to non-technical users while maintaining system integrity.

### 3.2 Dynamic Type Configuration Structure

```typescript
interface DynamicTypeConfig {
  id: string
  robotId: string        // Specific to a robot
  name: string           // Type name
  schema: JsonSchema     // JSON Schema definition
  channelType: 'readonly' | 'writeonly'
  channelLabel: string   // Channel label
  description?: string
  createdAt: number
  updatedAt: number
}
```

### 3.3 UI-Only Dynamic Type Creation

**Important**: Dynamic types and stores can **only be created through the UI interface**. They are not designed as a plugin system and cannot be created programmatically.

#### **3.3.1 UI-Based Creation Process**
Dynamic types are created exclusively through the `DynamicTypeManager` UI component:

1. **Access the UI**: Open the Dynamic Type Manager from the robot connection panel
2. **Use Templates or Custom Schema**: Choose from quick templates or create custom JSON Schema
3. **Configure Properties**: Set type name, channel type, and channel label through forms
4. **Automatic Store Creation**: When a dynamic type is created via UI, the corresponding store is automatically generated and integrated with the existing store managers

#### **3.3.2 Automatic Integration**
When a dynamic type is created through the UI:
- The system automatically creates the corresponding `DynamicReadOnlyStore` or `DynamicWriteOnlyStore`
- The store is registered with the appropriate store manager (`ReadOnlyStoreManager` or `WriteOnlyStoreManager`)
- Data channels are automatically configured for the new type
- The configuration is persisted to localStorage


### 3.4 Dynamic Store Management

#### **3.4.1 Query Existing Dynamic Stores**
Dynamic stores can only be queried after they have been created through the UI:

```typescript
// Query specific dynamic store (only if created via UI)
const store = dynamicTypeManager.getDynamicStoreFromManager(
  robotId, 
  'sensor_temperature'
)

// Query all dynamic stores for a robot (only UI-created ones)
const allStores = dynamicTypeManager.getAllDynamicStoresForRobot(robotId)
```

#### **3.4.2 Configuration Management**
Dynamic type configurations can be managed through the UI:
- View all dynamic types for a robot
- Edit existing dynamic type configurations
- Delete dynamic types (which also removes associated stores)
- Import/export configurations between robots

### 3.5 Configuration Persistence

Dynamic type configurations are automatically saved to localStorage and persist across app restarts.

```typescript
// Query configurations
const config = dynamicTypeManager.getConfig(configId)
const allConfigs = dynamicTypeManager.getAllConfigs()
const robotConfigs = dynamicTypeManager.getConfigsByRobotId(robotId)

// Update configuration
dynamicTypeManager.updateConfig(configId, {
  description: 'Updated description'
})

// Delete configuration
dynamicTypeManager.deleteConfig(configId)
```

### 3.6 UI-Based Dynamic Type Management

The system provides a user-friendly interface for creating and managing dynamic types without coding.

#### **3.6.1 Dynamic Type Manager UI**
The `DynamicTypeManager` component provides a comprehensive UI for:
- Creating new dynamic types with JSON Schema
- Managing existing dynamic types
- Quick templates for common data structures
- Real-time validation of JSON Schema

#### **3.6.2 Quick Templates**
The system includes pre-built templates for common data types:

```typescript
const QUICK_TEMPLATES = {
  'sensor-data': {
    name: 'sensor-data',
    schema: {
      type: 'object',
      properties: {
        temperature: { type: 'number' },
        humidity: { type: 'number' },
        pressure: { type: 'number' },
        timestamp: { type: 'string', format: 'date-time' }
      },
      required: ['temperature', 'humidity', 'timestamp']
    },
    description: 'Sensor data (temperature, humidity, pressure)'
  },
  'position-data': {
    name: 'position-data',
    schema: {
      type: 'object',
      properties: {
        x: { type: 'number' },
        y: { type: 'number' },
        z: { type: 'number' },
        heading: { type: 'number' },
        timestamp: { type: 'string', format: 'date-time' }
      },
      required: ['x', 'y', 'timestamp']
    },
    description: 'Position data (x, y, z, heading)'
  },
  'control-command': {
    name: 'control-command',
    schema: {
      type: 'object',
      properties: {
        command: { type: 'string', enum: ['start', 'stop', 'pause', 'resume'] },
        speed: { type: 'number', minimum: 0, maximum: 100 },
        direction: { type: 'string', enum: ['forward', 'backward', 'left', 'right'] },
        duration: { type: 'number', minimum: 0 }
      },
      required: ['command']
    },
    description: 'Control commands (start, stop, speed, direction)'
  }
}
```

#### **3.6.3 UI Workflow for Creating Dynamic Types**
1. **Access Dynamic Type Manager**: Click the dynamic type management button in the robot connection panel
2. **Choose Creation Method**:
   - Use quick templates for common data types
   - Create custom JSON Schema manually
   - Import existing schema
3. **Configure Type Properties**:
   - Set type name and description
   - Choose channel type (readonly/writeonly)
   - Specify channel label
   - Define JSON Schema structure
4. **Validation and Preview**: Real-time validation of JSON Schema with error highlighting
5. **Save and Deploy**: Save configuration and automatically create corresponding stores and channels

#### **3.6.4 Dynamic Type Management Features**
- **Visual Schema Editor**: Intuitive interface for creating JSON Schema
- **Template Library**: Pre-built templates for common use cases
- **Real-time Validation**: Immediate feedback on schema errors
- **Type Preview**: Preview of how data will be structured
- **Bulk Operations**: Manage multiple dynamic types simultaneously
- **Import/Export**: Share configurations between different robots or systems

## 4. Universal Widget Overview and Usage

### 4.1 Universal Widget Overview

Universal Widget is a generic widget system that can visualize various data types based on configuration. **Crucially, it is designed as a UI-only system** - Universal Widgets can **only be created through the user interface**, not programmatically. Unlike hardcoded widgets, new widgets are created using the visual configuration interface without any programming knowledge, making it accessible to non-technical users.

### 4.2 UI-Only Universal Widget Creation

**Important**: Universal Widgets can **only be created through the UI interface**. They are not designed as a plugin system and cannot be created programmatically.

#### **4.2.1 UI-Based Creation Process**
Universal Widgets are created exclusively through the `UniversalWidgetConfigurator` UI component:

1. **Access the UI**: Open the Universal Widget creation dialog from the dashboard
2. **Select Data Sources**: Choose from available data stores for the robot through the visual interface
3. **Add Visualizations**: Use the drag-and-drop interface to add and configure visualization types
4. **Configure Properties**: Set visualization properties through forms and real-time preview
5. **Layout Management**: Arrange visualizations using the visual layout manager
6. **Save and Deploy**: Save the configuration and add the widget to the dashboard


#### **4.2.2 Configuration Structure (Reference Only)**
The following shows the internal configuration structure that the UI generates, but these configurations are created and managed through the visual interface:

```typescript
// This structure is generated by the UI, not written manually
interface UniversalWidgetConfig {
  id: string
  robotId: string
  dataType: string
  visualizations: VisualizationConfig[]
  refreshInterval?: number
  maxDataPoints?: number
}
```

### 4.3 Universal Widget Management

#### **4.3.1 Widget Configuration Updates**
Universal Widgets created through the UI can be updated through the same visual interface:

- **Edit Existing Widgets**: Access the widget configuration through the dashboard
- **Real-time Preview**: See changes immediately as you modify settings
- **Configuration Persistence**: Changes are automatically saved and persisted

#### **4.3.2 Widget Lifecycle Management**
- **Creation**: Only through the Universal Widget Configurator UI
- **Modification**: Through the visual configuration interface
- **Deletion**: Through the dashboard widget management interface
- **Sharing**: Export/import widget configurations between dashboards

### 4.4 UI-Based Universal Widget Creation

The system provides a comprehensive UI for creating and configuring Universal Widgets without coding.

#### **4.4.1 Universal Widget Configurator**
The `UniversalWidgetConfigurator` component offers:
- Visual widget configuration interface
- Drag-and-drop visualization layout
- Real-time preview of widget appearance
- Data source selection from available stores
- Multiple visualization type configuration

#### **4.4.2 Widget Creation Workflow**
1. **Access Widget Configurator**: Open the Universal Widget creation dialog
2. **Select Data Sources**: Choose from available data stores for the robot
3. **Add Visualizations**: Select visualization types and configure their properties
4. **Configure Layout**: Arrange visualizations using drag-and-drop interface
5. **Preview and Test**: Real-time preview with sample data
6. **Save and Deploy**: Save configuration and add widget to dashboard

#### **4.4.3 Visual Configuration Features**
- **Data Source Browser**: Browse and select from available data stores
- **Visualization Type Selector**: Choose from chart, gauge, text, number, JSON types
- **Property Editor**: Configure visualization properties through forms
- **Layout Manager**: Drag-and-drop interface for arranging visualizations
- **Real-time Preview**: See changes immediately as you configure
- **Template Library**: Pre-built widget configurations for common use cases

#### **4.4.4 Advanced Configuration Options**
- **Multi-DataSource Support**: Combine data from multiple stores in one widget
- **Conditional Styling**: Configure colors and styles based on data values
- **Refresh Rate Control**: Set update intervals for real-time data
- **Data Filtering**: Apply filters to focus on specific data ranges
- **Export/Import**: Share widget configurations between dashboards


### 4.5 Visualization Type Characteristics

#### **Chart**
- Support for Line, Bar, Scatter charts
- Multiple Y-axis support
- Real-time data updates
- Animation effects

#### **Gauge**
- Circular gauge display
- Color changes based on thresholds
- Min/max value settings
- Real-time value updates

#### **Text**
- Simple text display
- Separate label and value display
- Custom styling

#### **Number**
- Large number display
- Unit display
- Increment/decrement indicators

#### **JSON**
- Structured data display
- Syntax highlighting
- Collapse/expand functionality
