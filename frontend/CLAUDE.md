# Frontend — MOSAIC-Server

React-based dashboard platform for remote robot control.

## Tech Stack

| Category         | Technology                                                       |
| ---------------- | ---------------------------------------------------------------- |
| Framework        | React 18, TypeScript 5                                           |
| Build            | Vite 6 + `@vitejs/plugin-react-swc`                              |
| Routing          | TanStack Router (file-based)                                     |
| Data Fetching    | TanStack Query (React Query) v5                                  |
| UI               | Chakra UI v3 + Emotion (CSS-in-JS)                               |
| HTTP             | Axios                                                            |
| Communication    | WebSocket (state sync) + WebRTC (media/data channels)            |
| 3D Rendering     | Three.js + `@react-three/fiber` + `@react-three/drei`            |
| Dashboard        | `react-grid-layout`                                              |
| Maps             | react-leaflet                                                    |
| Charts           | Chart.js + react-chartjs-2                                       |
| AI               | TensorFlow.js (object detection: CocoSSD, segmentation: DeepLab) |
| Serialization    | Protobuf (`protobufjs`)                                          |
| Forms            | react-hook-form                                                  |
| Linter/Formatter | oxlint + oxfmt                                                   |
| Testing          | Playwright (E2E)                                                 |

## Directory Structure

```
frontend/src/
├── App.tsx                    # QueryClient + RouterProvider setup
├── main.tsx                   # ReactDOM entry point
├── theme.tsx                  # Chakra UI global theme (primary color: #009688)
│
├── routes/                    # TanStack Router file-based routing
│   ├── __root.tsx             # Root layout
│   ├── _layout.tsx            # Auth-required layout (includes Sidebar + Navbar)
│   ├── _layout/
│   │   ├── dashboard/
│   │   │   ├── index.tsx      # /dashboard - tab list and redirect
│   │   │   ├── $tabId.tsx     # /dashboard/:tabId - dashboard rendering
│   │   │   └── config.tsx     # /dashboard/config
│   │   ├── robots.tsx         # /robots
│   │   ├── admin.tsx          # /admin
│   │   ├── settings.tsx       # /settings
│   │   ├── widget-customize.tsx
│   │   └── occupancy-maps.tsx
│   └── login/
│       ├── index.tsx          # /login
│       └── organization.tsx   # /login/organization
│
├── components/
│   ├── ui/                    # Chakra UI wrapper components
│   ├── Common/                # Navbar, Sidebar, SidebarItems, UserMenu, NotFound
│   ├── Dashboard/
│   │   ├── DashboardGrid.tsx  # Widget grid layout using react-grid-layout
│   │   ├── RobotConnectionPanel.tsx
│   │   └── Widgets/
│   │       ├── WidgetFactory.tsx    # Dynamic widget loading (code splitting)
│   │       ├── WidgetDescriptor.ts  # Widget metadata abstract class
│   │       └── WidgetComponents.tsx # MosaicWidget.Root/Header/Body wrappers
│   ├── Robots/
│   └── Admin/
│
├── widgets/                   # Widget plugins (each folder is an independent plugin)
│   ├── MediaViewerWidget/
│   ├── PointCloud3DViewerWidget/
│   ├── PointCloud2DViewerWidget/
│   ├── PointCloud2DViewerV2Widget/
│   ├── ObjectDetectionMediaWidget/
│   ├── SegmentationMediaWidget/
│   ├── LaserScanPolarViewerWidget/
│   ├── ImuState3DViewerWidget/
│   ├── OpenStreetMapViewerWidget/
│   ├── ThumbstickSenderWidget/
│   ├── WASDSenderWidget/
│   ├── JsonViewerWidget/
│   ├── ConnectionCheckWidget/
│   ├── DelayCheckWidget/
│   ├── MediaViewerWithStatWidget/
│   ├── ClearpathPlatformPowerViewerWidget/
│   ├── _templates/BaseTemplateWidget/  # Template for new widgets
│   └── _utils/widgetRegistry.ts       # Singleton registry (auto-discovery)
│
├── stores/                    # Data store plugins (each folder is an independent plugin)
│   ├── MediaStreamStore/      # WebRTC media stream
│   ├── PointCloudStore/       # Protobuf point cloud
│   ├── ProgressivePointCloudStore/
│   ├── JsonReceivableStore/
│   ├── StringReceivableStore/
│   ├── ThumbstickToTwistStore/
│   ├── Ros2WasdToTwistStore/
│   ├── H1DirectionSenderStore/
│   ├── ConnectionCheckReceiverStore/
│   ├── ConnectionCheckSenderStore/
│   └── _utils/storeRegistry.ts        # Singleton registry (auto-discovery)
│
├── mosaic/                    # Core architecture (WebRTC + Store abstraction)
│   ├── index.ts               # Core types (RobotConnector, WidgetConfig, RobotStatus, etc.)
│   ├── robot-info.ts          # RobotInfo class
│   ├── webrtc/                # WebRTC connection management
│   │   ├── webrtc-connection.ts
│   │   ├── webrtc-connection-manager.ts
│   │   └── signaling-server.ts
│   ├── channel/
│   │   └── channel-manager.ts
│   └── store/
│       ├── store-manager.ts   # Reference-counted Store creation/cleanup
│       └── interface/
│           ├── mosaic-store.ts       # Abstract base class
│           ├── receivable-store.ts   # ArrayBuffer → T conversion, subscription pattern
│           └── sendable-store.ts     # Sending via RTCDataChannel
│
├── contexts/
│   ├── MosaicProvider.tsx     # Robot/WebRTC/Store context provider
│   ├── MosaicContext.ts
│   ├── WebSocketProvider.tsx  # Single WebSocket connection manager
│   ├── WebSocketContext.ts
│   └── ws.dto.ts              # Type-safe WS message union types
│
├── hooks/
│   ├── useAuth.ts             # Login/signup/logout
│   ├── useWebSocket.ts        # WebSocket context access
│   ├── useMosaicStore.ts      # Store creation (getOrCreateStore) + release (releaseStore)
│   ├── useRobotInfo.ts        # Real-time robot state access
│   ├── useMosaicWebRTCConnection.ts
│   └── useCustomToast.ts
│
├── client/                    # REST API client (manually maintained)
│   ├── core/OpenAPI.ts        # Axios config (BASE URL, JWT token)
│   └── service/
│       ├── user.api.ts / user.dto.ts
│       ├── robot.api.ts / robot.dto.ts
│       ├── dashboard.api.ts / dashboard.dto.ts
│       ├── webrtc.api.ts / webrtc.dto.ts
│       └── occupancy-map.api.ts / occupancy-map.dto.ts
│
├── utils/
│   ├── envs.ts                # Env var accessors (getBackendUrl, getBackendWsUrl)
│   ├── robot-status.ts
│   └── index.ts               # Form validation rules, shared constants
│
└── protobuf/
    ├── proto.js               # pbjs generated code
    └── proto.d.ts             # pbts generated types
```

## Environment Variables

```
VITE_ENVIRONMENT=local
VITE_API_URL=https://api-dev-mosaic.acslgcs.com   # REST API base URL
VITE_WS_URL=wss://api-dev-mosaic.acslgcs.com      # WebSocket URL
```

Local defaults: API `http://localhost:9001`, WS `ws://localhost:9001`

## Development Commands

```bash
npm install --legacy-peer-deps
npm run dev              # Dev server
npm run build            # Production build
npm run protobuf:gen     # Generate Protobuf code (required before build)
npm run lint             # oxlint
npm run format           # oxfmt
```

---

## Core Architecture Patterns

### 1. Plugin-Based Widget System

Widgets live as independent folders under `src/widgets/`. They are auto-discovered at build time via `import.meta.glob`.

**Each widget requires two files in its folder:**

```
MyWidget/
├── MyWidgetDescriptor.ts   # Metadata (name, connector count, param schema)
└── MyWidget.tsx            # React component
```

**WidgetDescriptor example:**

```typescript
export class MyWidgetDescriptor extends WidgetDescriptor<MyParams> {
  getName() {
    return "MyWidget";
  }
  getRequiredStoreType() {
    return "receivable" as StoreType;
  }
  supportCustomParams() {
    return true;
  }
  getDefaultParams(): MyParams {
    return { someOption: true };
  }
}
```

**Widget component pattern (see `_templates/BaseTemplateWidget`):**

```typescript
export default function MyWidget({ widgetConfig }: WidgetProps) {
  const { getOrCreateStore, releaseStore } = useMosaicStore();

  useEffect(() => {
    const connector = widgetConfig.connectors[0];
    const store = getOrCreateStore(connector) as MyStore;
    const unsubscribe = store.subscribe((data) => { /* handle */ });
    return () => { unsubscribe(); releaseStore(connector); };
  }, [widgetConfig]);

  return (
    <MosaicWidget.Root widgetConfig={widgetConfig}>
      <MosaicWidget.Header>...</MosaicWidget.Header>
      <MosaicWidget.Body>...</MosaicWidget.Body>
    </MosaicWidget.Root>
  );
}
```

### 2. Plugin-Based Store System

Stores live as independent folders under `src/stores/`. Auto-discovered using the **folder name = file name** convention.

| Abstract Class       | Purpose                               | Implementation Point                                    |
| -------------------- | ------------------------------------- | ------------------------------------------------------- |
| `ReceivableStore<T>` | Receive data from WebRTC data channel | Implement `convertData(ArrayBuffer): T`                 |
| `SendableStore<T>`   | Send data via WebRTC data channel     | Implement `send(data: T)` (use `sendData()` internally) |

**Reference counting:** `StoreManager` shares a single Store instance per `RobotConnector`. When `releaseStore()` reduces the ref count to 0, the store is cleaned up.

### 3. WebRTC Connection Flow

```
1. API → issue rtcSessionId (webrtc.api.ts)
2. WebSocketProvider → signaling channel
3. WebRTCConnection → create RTCPeerConnection
4. Create data channels (based on Store's getChannelRequirements())
5. SDP Offer/Answer + ICE Candidate exchange (via WebSocket)
6. Connection established → assign DataChannel to Store
7. ReceivableStore: dc.onmessage → convertData() → subscriber callbacks
8. SendableStore: send() → dc.send()
```

### 4. WebSocket Message Type System

Union types in `ws.dto.ts` enforce type safety. Message type pattern: `"domain.action"`.

```typescript
sendWsMessage({ type: "status.subscribe", data: { robotIds: [...] } });
onWsMessage("status.update", (data: WsStatusUpdateDto) => { ... });
```

### 5. State Management Strategy

No Redux. Uses layered Context + Hooks + React Query.

| State Type                           | Solution                                |
| ------------------------------------ | --------------------------------------- |
| Server data (tabs, robot list, user) | React Query (`useQuery`, `useMutation`) |
| Real-time robot status               | `MosaicContext` (updated via WS events) |
| WebRTC/Store handles                 | `MosaicContext`                         |
| WS connection                        | `WebSocketContext`                      |
| Form state                           | `react-hook-form`                       |
| UI state                             | `useState`                              |

**React Query key conventions:**

```typescript
["currentUser"]["dashboardTabs"][("parsedDashboardTabConfig", tabId)][
  ("robots", page, searchQuery)
];
```

### 6. Dashboard Config Serialization

Widget layouts are stored as JSON strings in the DB (`TabConfigDto.widgets`).

```typescript
// On save
JSON.stringify({ widgets: [...] })  // RobotConnector serialized as { robotId, connectorId }

// On load
const widgets = JSON.parse(dto.widgets).widgets;
connectors.map(c => new RobotConnector(c.robotId, c.connectorId));
```

The last visited tab is remembered via `localStorage.setItem("dashboard:lastTabId", tabId)`.

### 7. Route Protection Pattern

```typescript
// _layout.tsx: auth guard
beforeLoad: async () => {
  if (!isLoggedIn()) throw redirect({ to: "/login" });
};
```

---

## RobotStatus Codes

```
0 = "Ready to Connect"    // initial state
1 = "RTC Connecting"
2 = "RTC Connected"
3 = "RTC Disconnecting"
4 = "RTC Failed"
5 = "Disconnected"
6 = "WS Connected"        // WebSocket only, no RTC
```

`RobotInfo.isConnected`: status === 2  
`RobotInfo.isReadyToConnect`: status === 0 or 5  
`RobotInfo.isRtcConnected`: status === 2

---

## Docker / Deployment

```dockerfile
# Stage 1: Build (Node 20)
npm run protobuf:gen && npm run build

# Stage 2: Serve (Nginx)
COPY dist/ /usr/share/nginx/html
# nginx.conf: SPA routing via try_files $uri /index.html
```

GitHub Actions CI: `.github/workflows/deploy-fe.yml`

---

## New Widget Checklist

1. Create `src/widgets/MyWidget/` folder
2. Write `MyWidgetDescriptor.ts` (extend `WidgetDescriptor`)
3. Write `MyWidget.tsx` (use `WidgetProps`, use `MosaicWidget.Root/Header/Body`)
4. If needed, write `src/stores/MyStore/MyStore.ts` (extend `ReceivableStore<T>` or `SendableStore<T>`)
5. Specify the Store type in Descriptor via `getRequiredStoreType()`
6. Use `_templates/BaseTemplateWidget` as a starting point

New Stores must have **matching folder and file names** to be auto-discovered by `storeRegistry.ts`.
