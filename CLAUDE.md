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
- **Priority-Based Status Management**: AI modifications (highest) > attendance records > calendar events
- **Automatic Status Expiration**: All statuses have expiration times with recovery mechanisms
- **Natural Language Interface**: AI understands and processes user requests via MCP Tools
- **Real-Time Updates**: Immediate status changes through AI conversation

## Development Phases

### Phase 1: Foundation & Infrastructure ⚡
**Goal**: Establish basic Electron + Vue3 application foundation
- ✅ Basic Electron + Vue3 setup with TypeScript
- ✅ TailwindCSS v4 integration and configuration  
- ✅ Project structure and build system (electron-vite)
- ✅ Pinia store and Vue Router setup

**Success Criteria**: Application starts successfully with basic UI framework

### Phase 2: Data Layer & Mock System 📊
**Goal**: Implement data storage and mock user system
- [ ] electron-store integration for local data persistence
- [ ] Mock data structures (Users, AttendanceRecords, CalendarEvents)
- [ ] Simple login/logout system with user switching
- [ ] Basic data access layer with CRUD operations

**Success Criteria**: Users can log in/out and basic data operations work

### Phase 3: Core Business Logic 🧠
**Goal**: Implement status management and business rules
- [ ] UserStatus and TimeSlot management system
- [ ] Priority-based status resolution (AI > attendance > calendar)
- [ ] Status expiration and automatic recovery mechanisms
- [ ] Data synchronization logic for attendance and calendar

**Success Criteria**: Status updates, conflicts, and expiration work correctly

### Phase 4: AI Integration & MCP Tools 🤖
**Goal**: Integrate AI for natural language processing
- [ ] MCP SDK integration (@modelcontextprotocol/sdk)
- [ ] Natural language query processing
- [ ] Status update commands via AI conversation
- [ ] Batch query functionality (multiple users at once)

**Success Criteria**: AI can understand and process status queries/updates in natural language

### Phase 5: User Interface 🎨
**Goal**: Create intuitive user interface
- [ ] Main dashboard with real-time status display
- [ ] AI chat interface for conversations
- [ ] Manual synchronization controls
- [ ] Status history and timeline views

**Success Criteria**: Complete UI allows all core functionality to be accessed intuitively

### Phase 6: Testing & Polish 🔧
**Goal**: Ensure reliability and performance
- [ ] Unit tests for business logic components
- [ ] Integration tests for AI functionality
- [ ] UI/UX refinements and accessibility
- [ ] Performance optimization and error handling

**Success Criteria**: Application is stable, tested, and ready for deployment

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
- **Frontend**: Vue 3 with TypeScript
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
- **Styling**: Tailwind CSS v4 with custom theme and component classes in `src/renderer/src/assets/main.css`
- **Icons**: @egoist/tailwindcss-icons plugin for icon support

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
  workSchedule: {
    startTime: string // Default "08:30"
    endTime: string   // Default "17:30"
  }
}
```

#### AttendanceRecord (Mock Data - Read-only)
```typescript
interface AttendanceRecord {
  id: string
  userId: string
  checkIn?: Date     // Check-in time (both office and wfh)
  checkOut?: Date    // Check-out time (both office and wfh)
  workType: 'office' | 'wfh'
  date: string       // YYYY-MM-DD
  status: 'on_duty' | 'off_duty' | 'on_leave' | 'wfh'
  startTime: Date    // Scheduled start time
  endTime: Date      // Scheduled end time
}
```

#### CalendarEvent (Mock Data - Read-only)
```typescript
interface CalendarEvent {
  id: string
  userId: string
  title: string
  startTime: Date
  endTime: Date
  status: 'scheduled' | 'ongoing' | 'completed' | 'canceled'
  eventStatus: 'meeting'
}
```

#### UserStatus (Main Status Table - Read/Write)
```typescript
type StatusType = 'on_duty' | 'off_duty' | 'on_leave' | 'wfh' | 'out' | 'meeting'

interface UserStatus {
  userId: string
  name: string
  
  // Current effective status (calculated by priority)
  currentStatus: StatusType
  statusDetail?: string
  lastUpdated: Date
  expiresAt: Date
  
  // All time slots (sorted by priority and time)
  timeSlots: TimeSlot[]
}

interface TimeSlot {
  id: string
  startTime: Date
  endTime: Date
  status: StatusType
  statusDetail?: string
  source: 'attendance' | 'calendar' | 'ai_modified'
  priority: number // 3=AI modified, 2=attendance, 1=calendar
  createdAt: Date
  expiresAt: Date
}
```

## Business Logic

### Status Priority System
1. **AI Modified** (Priority 3) - Highest priority, user-requested changes
2. **Attendance Records** (Priority 2) - Official attendance data
3. **Calendar Events** (Priority 1) - Meeting and event data

### Status Expiration Rules
- **Work statuses** (`on_duty`, `wfh`, `out`, `meeting`): Expire at 17:30 (end of workday)
- **Off-duty status**: Expires at 08:30 next working day
- **Leave status**: Expires at end of leave period
- **Meeting status**: Expires at meeting end time

### Status Recovery Logic
1. **Time boundary check**: Non-working hours → `off_duty`
2. **High priority check**: Use unexpired high-priority TimeSlots
3. **Current activity check**: Check for active leave/meeting/out status
4. **Attendance check**: Based on check-in/out status and work type
5. **Default**: `on_duty` during work hours, `off_duty` otherwise

### Data Synchronization Strategy
1. **App startup**: Auto-sync current day attendance and calendar data
2. **Manual sync**: User-triggered refresh of source data
3. **AI updates**: Real-time status changes via MCP Tools with conflict resolution

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
