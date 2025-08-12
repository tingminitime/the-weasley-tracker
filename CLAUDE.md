# 查勤魔法 (The Weasley Tracker) - CLAUDE.md

This file provides guidance to Claude Code when working with the **查勤魔法 (The Weasley Tracker)** project - an AI-powered attendance tracking system inspired by the Weasley Clock from Harry Potter.

## Project Overview

**查勤魔法 (The Weasley Tracker)** is a desktop application that tracks team member status and integrates AI with MCP Tools to intelligently manage and query attendance information. This MVP focuses on concept validation using offline data and natural language interactions.

### Core Objective
1. **Concept Validation**: Prove AI + MCP Tools feasibility for attendance management
2. **Offline First**: Use electron-store for local data storage with Mock Data
3. **Natural Language Interface**: AI understands and processes status queries/updates
4. **Smart Status Management**: Priority-based status with expiration and recovery logic
5. **Batch Operations**: Support queries like "Who's in meetings?" or "What's John and Mary's status?"

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

### Technology Stack
- **Frontend**: Vue 3 with TypeScript, Tailwind CSS v4
- **Desktop Framework**: Electron with electron-vite
- **Data Storage**: electron-store (offline, local storage)
- **AI Integration**: @modelcontextprotocol/sdk for MCP Tools
- **Build System**: Vite with TypeScript strict mode
- **Code Quality**: ESLint (Antfu config) + better-tailwindcss plugin

### Project Structure
- `src/main/` - Electron main process code
- `src/preload/` - Secure IPC communication layer
- `src/renderer/` - Vue.js frontend application
- `src/shared/` - Shared TypeScript interfaces and utilities
- `out/` - Compiled output directory
- `build/` - Build artifacts
- `resources/` - Application assets (icons, etc.)

### Key Files
- `src/main/index.ts` - Main Electron process entry point
- `src/preload/index.ts` - Preload script exposing APIs to renderer
- `src/renderer/src/App.vue` - Main Vue component
- `src/renderer/src/main.ts` - Vue app initialization
- `electron.vite.config.ts` - Build configuration with path aliases

## Data Models

### Core Interfaces
```typescript
type StatusType = 'on_duty' | 'off_duty' | 'on_leave' | 'wfh' | 'out' | 'meeting'

interface UserStatus {
  userId: string
  name: string
  currentStatus: StatusType
  statusDetail?: string
  lastUpdated: Date
  expiresAt: Date
  timeSlots: TimeSlot[]
}

interface TimeSlot {
  id: string
  startTime: Date
  endTime: Date
  status: StatusType
  statusDetail?: string
  source: 'attendance' | 'calendar' | 'ai_modified'
  priority: number // 3=AI, 2=Attendance, 1=Calendar
  createdAt: Date
  expiresAt: Date
}
```

### Mock Data Sources
- **MockUser**: User profiles with work schedules
- **AttendanceRecord**: Check-in/out records with work location type
- **CalendarEvent**: Meeting schedules with status tracking

## Business Logic

### Status Priority System
1. **AI Modified** (Priority 3): User requests via AI interface
2. **Attendance Records** (Priority 2): Check-in/out system data
3. **Calendar Events** (Priority 1): Meeting schedules

### Status Expiration & Recovery
- **Work Status** (`on_duty`, `wfh`, `out`, `meeting`): Expires at 17:30
- **Off Duty**: Expires at next day 08:30
- **Leave**: Expires based on leave period
- **Meeting**: Expires when meeting ends

### Conflict Resolution
- **Last-In-First-Out**: New status overwrites conflicting time periods
- **Historical Preservation**: Ask users if they want to preserve overwritten history

## Development Phases

### Phase 1: Foundation & Data Layer (2 weeks)
**Deliverables:**
- Mock data system setup
- electron-store integration
- Basic status management logic
- User authentication system (mock)

**Success Metrics:**
- Can store/retrieve user status data
- Mock users can login/logout
- Basic status display works

**Key Tasks:**
- Set up TypeScript interfaces
- Implement data persistence with electron-store
- Create mock data generators
- Build basic Vue components

### Phase 2: Status Logic & Sync (3 weeks)  
**Deliverables:**
- Priority-based status system
- Status expiration/recovery mechanism
- Data synchronization workflows
- Time conflict handling

**Success Metrics:**
- Status updates respect priority rules
- Expired status auto-recovers correctly
- Sync preserves user modifications
- Time conflicts resolve properly

**Key Tasks:**
- Implement status calculation engine
- Build expiration/recovery logic
- Create sync mechanisms
- Add conflict resolution

### Phase 3: AI & MCP Tools Integration (3 weeks)
**Deliverables:**
- MCP SDK integration
- Natural language processing
- Status query/update via AI
- Conflict handling with user confirmation

**Success Metrics:**
- AI understands status queries
- Can update status via natural language
- Batch queries work correctly
- User confirmations for conflicts

**Key Tasks:**
- Integrate @modelcontextprotocol/sdk
- Build MCP Tools for status operations
- Create AI conversation interface
- Implement natural language parsing

### Phase 4: UI/UX & Polish (2 weeks)
**Deliverables:**
- Complete user interface
- AI chat interface
- Manual sync functionality
- Error handling & user feedback

**Success Metrics:**
- Intuitive user experience
- Responsive AI conversations
- Clear status visualization
- Comprehensive error handling

**Key Tasks:**
- Build main dashboard
- Create AI chat component
- Add manual sync controls
- Implement error boundaries

## Code Standards & Guidelines

### TypeScript
- Strict mode enabled across all tsconfig files
- Explicit type definitions for all interfaces
- No `any` types without justification
- Prefer interfaces over type aliases for object shapes

### Vue Components
- Use `<script setup lang="ts">` syntax
- Composition API with TypeScript support
- Props and emits must be typed
- Single File Components (.vue) preferred

### Data Management
- Use electron-store for persistent data
- Implement data validation for all inputs
- Handle data migration between versions
- Create backup mechanisms for critical data

### AI Integration
- Validate AI responses before processing
- Implement fallback mechanisms for AI failures
- Log AI interactions for debugging
- Test with various natural language inputs

## Testing Strategy

### Unit Tests
- Data model validation
- Status calculation logic
- Time conflict resolution
- Expiration/recovery mechanisms

### Integration Tests
- electron-store data persistence
- IPC communication
- MCP Tools integration
- AI response processing

### User Acceptance Tests
- Login/logout workflows
- Status query scenarios
- Status update via AI
- Manual sync operations
- Error handling paths

## Debugging & Development

### Recommended Development Flow
1. Start with `pnpm dev` for hot reload
2. Use browser DevTools for renderer debugging
3. Check main process logs in terminal
4. Test IPC communication with simple ping/pong
5. Validate data persistence with electron-store

### Common Issues
- **IPC Communication**: Ensure preload script is loaded correctly
- **Data Persistence**: Check electron-store path permissions
- **AI Integration**: Verify MCP SDK configuration
- **TypeScript Errors**: Run `pnpm typecheck` regularly

## Project Success Metrics

### Technical Metrics
- TypeScript compilation without errors
- All ESLint rules passing
- Unit test coverage > 80%
- Electron app starts within 3 seconds

### Functional Metrics
- AI correctly processes 90%+ of natural language queries
- Status updates happen within 1 second
- Data sync completes within 5 seconds
- No data loss during app restarts

### User Experience Metrics
- Intuitive status visualization
- Responsive AI conversations
- Clear error messages
- Smooth login/logout process