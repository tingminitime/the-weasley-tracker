# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Weasley Tracker** (查勤魔法) is an MVP Electron desktop application inspired by the Weasley Clock from Harry Potter. The application tracks employee attendance and status with AI-powered natural language interaction.

### Core Objectives
1. **Proof of Concept**: Validate AI + MCP Tools integration for employee status management
2. **Single-Machine Mode**: Uses electron-store for local data storage with mock data
3. **Multi-User Simulation**: Mock user system with simple login/logout functionality
4. **AI-Powered Queries**: Natural language status queries and updates via MCP Tools
5. **Batch Operations**: Support queries like "有誰正在會議中?" or "小王、小李、小陳現在的狀態是?"

### Key Features
- **6 Status Types**: `on_duty`, `off_duty`, `on_leave`, `wfh`, `out`, `meeting`
- **Simplified Status Management**: Time-based automatic status + persistent user-defined statuses
- **Basic Time Boundary Logic**: Auto-switch between on_duty/off_duty based on 08:30-17:30 schedule
- **Natural Language Interface**: AI understands and processes user requests via MCP Tools
- **Real-Time Updates**: Immediate status changes through AI conversation
- **Status History Tracking**: Complete record of all status changes with timestamps

## Development Phases

### Phase 1: Foundation & Infrastructure ⚡
**Goal**: Establish basic Electron + Vue3 application foundation
- [x] Basic Electron + Vue3 setup with TypeScript
- [x] TailwindCSS v4 integration and configuration  
- [x] Project structure and build system (electron-vite)
- [x] Pinia store and Vue Router setup

**Success Criteria**: Application starts successfully with basic UI framework

### Phase 2: Data Layer & Mock System 📊
**Goal**: Implement data storage and mock user system
- [x] electron-store integration for local data persistence
- [x] Mock data structures (Users, AttendanceRecords, CalendarEvents)
- [x] Simple login/logout system with user switching
- [x] Basic data access layer with CRUD operations

**Success Criteria**: Users can log in/out and basic data operations work

### Phase 3: Core Business Logic 🧠
**Goal**: Implement simplified status management and business rules
- [x] UserStatus and StatusHistory management system
- [x] Time-based automatic status logic (08:30-17:30)
- [x] Persistent user-defined status functionality
- [x] Status refresh and history tracking

**Success Criteria**: Status updates, time boundaries, and history tracking work correctly

### Phase 4: Chat Interface & Mock AI 🎨
**Goal**: Create chat interface with basic mock AI conversation system
- [x] Chat interface (`/chat`) - AI conversation page (default after login)
- [x] ChatMessage component - Display user and AI messages
- [x] ChatInput component - User input with keyboard shortcuts
- [x] Mock AI processing logic - Basic random response simulation
- [x] Home redirect (`/`) - Automatically redirects to `/chat`
- [x] Navigation between chat and dashboard pages

**Success Criteria**: Complete chat interface with basic mock AI that provides generic responses

### Phase 5: MCP Server Foundation & Basic Integration 🏗️
**Goal**: Set up MCP server infrastructure and establish basic AI communication
- [x] MCP SDK integration (@modelcontextprotocol/sdk)
- [x] Set up independent MCP server infrastructure (separate from `pnpm dev`)
- [x] Implement MCP server connection status display in frontend
- [x] Create IPC communication layer for MCP server integration
- [x] Configure OpenAI API Key storage via `.env` file
- [x] Replace mock AI responses with basic MCP-powered processing

**Success Criteria**: MCP server runs independently, connects successfully, and basic AI responses work

### Phase 6: Advanced AI Features & Status Management 🤖
**Goal**: Implement comprehensive AI-powered status queries and updates
- [x] Status query functionality - Single and batch user queries
- [x] Status update commands - AI-driven status modifications
- [x] Enhanced natural language query processing with error handling
- [x] Advanced status update parsing and validation
- [x] Batch operations support ("有誰正在會議中?" queries)
- [x] AI conversation context and memory management

**Success Criteria**: AI can accurately understand and process all status queries/updates in natural language

### Phase 7: UI Enhancement & Testing 🔧
**Goal**: Complete remaining UI features and ensure reliability
- [ ] Manual synchronization controls integration
- [ ] Status history and timeline views
- [ ] Navigation guards for authentication
- [ ] Unit tests for business logic components
- [ ] Integration tests for AI functionality
- [ ] UI/UX refinements and accessibility
- [ ] Performance optimization and error handling

**Success Criteria**: Application is fully featured, stable, tested, and ready for deployment

## Development Commands

**Package Manager**: This project uses `pnpm`
- Install dependencies: `pnpm install`
- Start development: `pnpm dev`
- Build for production: `pnpm build`
- Type checking: `pnpm typecheck` (runs both node and web type checks)
- Linting: `pnpm lint`
- Preview built app: `pnpm start`

**Building for Distribution**:
- Windows: `pnpm build:win`
- macOS: `pnpm build:mac` 
- Linux: `pnpm build:linux`
- Unpacked build: `pnpm build:unpack`

## Architecture

This is an Electron application built with the following stack:
- **Frontend**: Vue 3 (TypeScript) + Vue Router v4 + Pinia
- **Styling**: Tailwind CSS v4 with better-tailwindcss ESLint plugin
- **Build System**: electron-vite (combines Vite with Electron tooling)
- **Main Process**: TypeScript (`src/main/index.ts`)
- **Renderer Process**: Vue 3 + TypeScript (`src/renderer/`)
- **Preload Script**: TypeScript (`src/preload/index.ts`)
- **Data Storage**: electron-store for local persistence
- **AI Integration**: @modelcontextprotocol/sdk for MCP Tools
- **Auto-updater**: electron-updater integration

### Project Structure
- `src/main/` - Electron main process code
- `src/preload/` - Preload scripts for secure IPC
- `src/renderer/` - Vue.js frontend application
- `out/` - Compiled output directory
- `build/` - Build artifacts
- `resources/` - Application assets (icons, etc.)

### Key Files
- `src/main/index.ts` - Main Electron process entry point
- `src/preload/index.ts` - Preload script exposing APIs to renderer
- `src/renderer/src/App.vue` - Main Vue component
- `src/renderer/src/main.ts` - Vue app initialization
- `electron.vite.config.ts` - Build configuration with Vue plugin and path aliases

### Build Configuration
The `electron.vite.config.ts` file configures:
- Main and preload processes with externalized dependencies
- Renderer process with Vue plugin and Tailwind CSS v4
- Path alias: `@renderer` points to `src/renderer/src`

### IPC Communication
- Basic IPC setup exists with ping/pong example
- Preload script exposes `window.electron` and `window.api` to renderer
- Uses `@electron-toolkit/preload` for secure API exposure

### Frontend Architecture
- **State Management**: Pinia store setup in `src/renderer/src/main.ts`
- **Routing**: Vue Router with hash-based navigation configured in `src/renderer/src/router/`
  - `/` - Home page, redirects to `/chat`
  - `/login` - Login page, redirected to if user not authenticated
  - `/chat` - AI conversation page, default page after login
  - `/dashboard` - Status overview page showing all colleagues' status
- **Styling**: Tailwind CSS v4 with custom theme and component classes in `src/renderer/src/assets/main.css`
- **Icons**: @egoist/tailwindcss-icons plugin for icon support
- **Composition Utilities**: VueUse composables (@vueuse/core) for reactive utilities, DOM manipulation, and lifecycle management

### Code Standards
- ESLint configuration using Antfu's config with TypeScript and Vue support
- Tailwind CSS class organization enforced by better-tailwindcss plugin
- TypeScript strict mode enabled across all tsconfig files
- Vue components must use TypeScript (`<script setup lang="ts">`)
- Console statements produce warnings
- HTML self-closing tags enforced for components, never for HTML elements
- Unused imports and variables produce warnings

## Data Structures

### Core Interfaces

#### MockUser (Read-only)
```typescript
interface MockUser {
  id: string
  name: string
  department: string
  tag?: string
  customTags?: string[]
  workSchedule: {
    startTime: string // Fixed at "08:30"
    endTime: string // Fixed at "17:30"
  }
}
```


#### UserStatus (Main Status Table - Read/Write)
```typescript
type StatusType = 'on_duty' | 'off_duty' | 'on_leave' | 'wfh' | 'out' | 'meeting'

interface UserStatus {
  userId: string
  name: string
  
  // Current status
  currentStatus: StatusType
  statusDetail?: string // Optional status description
  lastUpdated: Date
  
  // Daily status change history
  statusHistory: StatusHistoryEntry[]
}

interface StatusHistoryEntry {
  id: string
  status: StatusType
  statusDetail?: string // Optional status description
  timestamp: Date // Change timestamp
  source: 'system' | 'ai_modified' // system auto or AI modified
}
```

## Business Logic

### Simplified Status Management
1. **Basic Status Logic**: Automatic time-based status assignment
   - Current time < 08:30: `off_duty`
   - 08:30 ≤ Current time ≤ 17:30: `on_duty`
   - Current time > 17:30: `off_duty`

2. **User-Defined Status**: AI-modified statuses override basic logic
   - Users can set any status via AI conversation
   - Set statuses persist until manually changed or refreshed
   - All 6 status types supported: `on_duty`, `off_duty`, `on_leave`, `wfh`, `out`, `meeting`

3. **Status Refresh**: Return to basic time boundary logic
   - Triggered by "Refresh" button or specific user requests
   - Clears user-defined status and applies time logic
   - Records change in status history

### Status History Tracking
- **Complete Record**: All status changes are logged with timestamps
- **Source Tracking**: Distinguishes between system auto-changes and AI modifications
- **Simple Structure**: No complex priorities or expiration times

### Data Strategy
1. **App Startup**: Load user data and current statuses
   - **Cross-Day Check**: Compare current date with top-level `initializedDate` in AppData
   - If dates don't match: Re-initialize all mock data and update `initializedDate`
   - All users share the same initialization date for consistent daily resets
2. **Status Refresh**: Apply basic time boundary logic with cross-day check
3. **AI Updates**: Direct status changes via MCP Tools

### Cross-Day Handling
- **Single Date Management**: One `initializedDate` at top-level of data structure
- **Unified Reset**: All users reset together when crossing day boundary
- **Status History Reset**: All `statusHistory` arrays cleared on new day
- **Mock Data Regeneration**: Complete regeneration when date mismatch detected
- **Date Synchronization**: Single source of truth for initialization date

## Success Criteria & Validation

### MVP Success Metrics
1. **Core Functionality**
   - ✅ All 6 status types can be displayed and updated
   - ✅ Priority system correctly resolves status conflicts
   - ✅ Status expiration and recovery mechanisms work reliably
   - ✅ AI understands and processes natural language requests

2. **AI Integration**
   - ✅ Single user queries: "What is John doing?"
   - ✅ Batch queries: "Who is currently in meetings?"
   - ✅ Status updates: "I'm going out, back at 3 PM"
   - ✅ MCP Tools integration functions correctly

3. **User Experience**
   - ✅ Intuitive login/logout with user switching
   - ✅ Real-time status display updates
   - ✅ Responsive AI chat interface
   - ✅ Manual sync functionality works

### Testing Strategy
1. **Unit Tests**
   - Status priority resolution logic
   - Expiration and recovery mechanisms
   - TimeSlot conflict handling
   - Mock data generation and validation

2. **Integration Tests**
   - AI conversation flow end-to-end
   - MCP Tools communication
   - electron-store data persistence
   - Status synchronization across components

3. **User Acceptance Tests**
   - Natural language query accuracy
   - Status update responsiveness
   - UI usability and accessibility
   - Error handling and edge cases

### Validation Methods
1. **Mock Data Validation**: Comprehensive test data covering all scenarios
2. **AI Response Accuracy**: 95%+ correct interpretation of natural language
3. **Status Consistency**: No conflicts between priority levels
4. **Error Recovery**: Graceful handling of edge cases and failures

## Related Project Documentation
- **`/docs/查勤魔法(The_Weasley_Tracker)_專案規劃.md`** - Project planning document with MVP objectives, features, and technical design
- **`/docs/查勤魔法(The_Weasley_Tracker)_資料更新流程_mermaid.md`** - Data update workflow flowchart
- **`/docs/查勤魔法(The_Weasley_Tracker)_介面互動流程_mermaid.md`** - User interface interaction flowchart
