# Backend — MOSAIC-Server

Spring WebFlux-based server for robot remote control. Handles WebRTC signaling and real-time state management.

## Tech Stack

| Category | Technology |
|----------|-----------|
| Language | Java 21 |
| Framework | Spring Boot 3.4.2 (WebFlux — fully reactive) |
| Build | Gradle 8 |
| ORM | JOOQ 3.20.10 (code-generated, type-safe queries) |
| Database | PostgreSQL (R2DBC — async driver) |
| Migration | Flyway |
| Security | Spring Security WebFlux + JJWT 0.12.6 (RS256) |
| Cryptography | Bouncy Castle (RSA-2048, AES-256) |
| Web Server | Undertow (embedded) |
| Code Style | Google Java Format (enforced via Spotless) |
| Other | Lombok, Jackson |

## Directory Structure

```
backend/src/main/java/com/gistacsl/mosaic/
├── account/            # Login, signup
├── user/               # User profile
├── organization/user/  # Org-admin user CRUD
├── robot/              # Robot CRUD, status management, auth tokens
├── dashboard/          # Dashboard tab CRUD
├── occupancy_map/      # Navigation map file management
├── webrtc/             # WebRTC session creation, ICE servers
├── websocket/
│   ├── config/         # WebSocket handler mapping, upgrade strategy
│   ├── handler/        # Per-message-type handlers
│   ├── scheduler/      # Periodic state checks
│   └── session/        # RobotWsSession, UserWsSession, WsSessionManager
├── security/           # JWT filter, SecurityConfig
├── cryptor/            # MosaicKeyService, KeyEncryptionService
├── repository/         # JOOQ-based repositories
├── common/             # Shared utilities, ResultCode, CustomException
└── BackendApplication.java
```

```
backend/src/main/resources/
├── application.yml         # Base config (port: 9001)
├── application-local.yml   # Local DB config
├── application-prod.yml    # Production file paths
└── db/migration/           # Flyway SQL migrations
```

## Configuration

**Key values in application.yml:**
```yaml
server.port: 9001
jwt.access-token.expiration-time: 15552000000  # 180 days
file.storage.base-path: /var/mosaic/storage
mosaic.security.encryption-key: <Base64 AES-256 key>
```

**Per-profile DB (application-local.yml):**
```yaml
spring.r2dbc.url: r2dbc:postgresql://localhost:5432/mosaic
spring.flyway.url: jdbc:postgresql://localhost:5432/mosaic
file.storage.base-path: ./local-storage
```

---

## DB Schema

```
organization        (id UUID pk, name, created_at, updated_at)
users               (id UUID pk, organization_fk, email, is_active,
                     is_organization_admin, full_name, hashed_password)
robot               (id UUID pk, organization_fk, status, auth_type,
                     name, description, connector_config JSONB)
tab                 (id UUID pk, organization_fk, name, tab_config JSONB)
occupancy_map       (id UUID pk, organization_fk, name, pgm_file_path, yaml_file_path)
key_pair            (id UUID pk, purpose UNIQUE, algorithm, key_size,
                     public_key TEXT, encrypted_private_key TEXT)
ice_server          (id UUID pk, urls, username, credential)
dynamic_type_config (id SERIAL pk, organization_fk UNIQUE, configuration JSONB)
```

`connector_config`, `tab_config`, and `configuration` columns are stored as JSONB.  
JOOQ classes are auto-generated from Flyway migration scripts.

---

## REST API Endpoints

```
# Auth (public)
POST   /api/v1/account/login/access-token                  # Personal login
POST   /api/v1/account/login/organization/access-token     # Organization login
POST   /api/v1/account/signup                              # Sign up

# User
GET    /api/v1/users/me
PUT    /api/v1/users/me
PUT    /api/v1/users/me/password

# Organization admin only (ROLE_ORGANIZATION_ADMIN)
GET/POST/PUT/DELETE  /api/v1/organization/users

# Robot
GET/POST             /api/v1/robots
GET/PUT/DELETE       /api/v1/robots/{id}
POST                 /api/v1/robot-auth/simple-token/{robotId}

# Dashboard tabs
GET/POST             /api/v1/dashboard/tabs
GET/PUT/DELETE       /api/v1/dashboard/tabs/{tabId}
PUT                  /api/v1/dashboard/tabs/{tabId}/configs

# WebRTC
POST  /api/v1/webrtc/connection    # Create WebRTC session
GET   /api/v1/webrtc/ice-servers

# Occupancy Map
GET/POST             /api/v1/occupancy_map
GET/DELETE           /api/v1/occupancy_map/{id}
GET                  /api/v1/occupancy_map/{id}/pgm
GET                  /api/v1/occupancy_map/{id}/yaml
GET                  /api/v1/occupancy_map/{id}/download   # ZIP
```

---

## WebSocket Endpoints

| Endpoint | Client | Handler |
|---------|--------|---------|
| `/ws/robot` | Robot client | `RobotWsHandler` |
| `/ws/user` | Web user | `UserWsHandler` |

**Message protocol:** `{ "type": "domain.action", "data": { ... } }`

| Type Prefix | Purpose |
|------------|---------|
| `authorize.*` | Initial authentication (required right after connect) |
| `signaling.*` | WebRTC SDP/ICE exchange |
| `status.*` | Robot status subscribe/update |
| `ping.*` / `pong.*` | Keep-alive |

---

## Authentication & Authorization

**JWT structure (RS256):**
```
{ sub: userPk, org: organizationPk, role: "ROLE_ORGANIZATION_ADMIN"|"ROLE_USER", exp }
```

**Flow:**
1. Login → BCrypt password verification → JWT issued (valid for 180 days)
2. Requests include `Authorization: Bearer {token}` header
3. `BearerTokenAuthenticationFilter` → `JwtTokenService.getUserAuthFromToken()`
4. `UserAuth` stored in `SecurityContextHolder`

**RSA key storage:** Stored in the `key_pair` table; private key encrypted with AES-256 before storage.  
**Role separation:** `/api/v1/organization/**` paths require `ROLE_ORGANIZATION_ADMIN`.

---

## Core Architecture Patterns

### 1. Dual WebSocket Session Management

Robot and User sessions are managed in separate `ConcurrentHashMap`s. The server acts as a broker — robots and users cannot communicate directly.

```
WsSessionManager
├── Map<UUID, RobotWsSession>   robotSessionMap
└── Map<UUID, UserWsSession>    userSessionMap
```

### 2. Pre-Auth Message Queuing

Messages arriving before authentication completes are stored in a `LinkedBlockingQueue<WsMessage>` (pendingMessages) and processed sequentially after auth succeeds. Prevents message loss without requiring client retries.

### 3. WebRTC Signaling Flow

```
1. User → POST /api/v1/webrtc/connection (robotIds)
   └─ Validates robot is in WS_CONNECTED state
   └─ Creates WebRTCSession (1:1 binding: robotWsSession ↔ userWsSession)

2. Server → Robot: signaling.prepare_connection (rtcConnectionId)

3. Robot → Server → User: signaling.send_sdp_answer

4. Bidirectional: signaling.exchange_ice_candidate
```

### 4. Plugin-Based Robot Authentication

Extensible auth via the `RobotAuthType` enum:

| Type | Description |
|------|-------------|
| `NO_AUTHORIZATION` | No authentication |
| `SIMPLE_TOKEN` | AES+HMAC token (`robotPk|timestamp|nonce`) |

New auth methods are added with the `@RobotAuthHandler(RobotAuthType.NEW_TYPE)` annotation.

### 5. Personal vs Organization Accounts

| Type | Structure |
|------|-----------|
| Personal | `Organization.name = User.email` (1:1) |
| Organization | `Organization.name = company name`, multiple users (N:1) |

Login endpoints are separate (`/access-token` vs `/organization/access-token`).

### 6. Reactive Transaction Pattern

```java
Mono.from(dslContext.transactionPublisher(config -> {
    DSLContext tx = config.dsl();
    return createOrganization(tx)
        .flatMap(org -> createDefaultTab(org, tx))
        .flatMap(tab -> createUser(tab, tx));
}))
```

---

## Docker / Deployment

```dockerfile
# Stage 1: Build (Zulu JDK 21)
./gradlew bootJar --no-daemon

# Stage 2: Run (Zulu JRE 21)
EXPOSE 9001
ENTRYPOINT ["java", "-jar", "app.jar"]
# Requires volume mount at /mosaic-server/storage
```

GitHub Actions CI: `.github/workflows/deploy-be.yml`