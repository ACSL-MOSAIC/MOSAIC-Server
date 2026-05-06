# MOSAIC-Server

A full-stack web platform for remote robot control and monitoring.

## Project Structure

```
MOSAIC-Server/
├── frontend/   # React + Vite frontend
├── backend/    # Spring Boot backend
└── deploy/     # Deployment configuration
```

## Detailed Documentation

Read the document for your working area. If modifying both areas at once, read both documents.

| Working Area | Document to Read |
|-------------|-----------------|
| All files under `frontend/` | [`frontend/CLAUDE.md`](frontend/CLAUDE.md) |
| All files under `backend/` | [`backend/CLAUDE.md`](backend/CLAUDE.md) |

## Project Overview

- **Frontend**: React 18 + TypeScript + TanStack Router/Query + Chakra UI. Visualizes robot telemetry on a dashboard via a plugin-based widget system. Receives real-time data over WebRTC data channels.
- **Backend**: Java 21 + Spring WebFlux + JOOQ + PostgreSQL. Acts as a WebRTC signaling server. Manages Robot/User WebSocket sessions separately, with the server acting as a message broker.
- **Communication flow**: REST (auth/config) + WebSocket (real-time status + signaling) + WebRTC (media/data channels).