# AGENT.md — MOSAIC-Server

> **Always read CLAUDE.md before starting any work.**  
> Project structure, architecture, tech stack, and task guidelines are all documented there.

## Required Reading Order

1. **Always**: `CLAUDE.md` (root) — project overview and sub-document locations
2. **For frontend work**: `frontend/CLAUDE.md` — widget system, Store, WebRTC, state management, etc.
3. **For backend work**: `backend/CLAUDE.md` — API, DB schema, WebSocket, authentication, etc.

## How to Determine Working Area

| File / Path Pattern | Document to Read |
|--------------------|-----------------|
| `frontend/src/**` | `frontend/CLAUDE.md` |
| `frontend/src/widgets/**` | `frontend/CLAUDE.md` (see widget checklist) |
| `frontend/src/stores/**` | `frontend/CLAUDE.md` (see Store system) |
| `backend/src/**` | `backend/CLAUDE.md` |
| `backend/src/main/resources/db/migration/**` | `backend/CLAUDE.md` (see DB schema) |
| `.github/workflows/deploy-fe.yml` | `frontend/CLAUDE.md` |
| `.github/workflows/deploy-be.yml` | `backend/CLAUDE.md` |

## Agent Principles

- Read the relevant CLAUDE.md before writing any code to understand existing patterns.
- When adding a widget or Store, follow the existing plugin structure (see `frontend/CLAUDE.md`).
- When adding a new API endpoint, follow the existing layered structure (Controller → Service → Repository).
- All DB changes must be added as a Flyway migration file.
- When modifying both frontend and backend, read both CLAUDE.md files.