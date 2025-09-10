# The Weasley Tracker (查勤魔法)

An AI-powered employee status tracking desktop application inspired by the Weasley Clock from Harry Potter. Built with Electron, Vue 3, and TypeScript, featuring natural language interaction for intuitive status management.

## Features

### 🤖 AI-Powered Status Management
- **Natural Language Queries**: Ask questions like "Who is currently in meetings?" or "What is John doing?"
- **Intelligent Status Updates**: Tell the AI "I'm going out for lunch, back at 2 PM" and it handles the rest
- **Multi-language Support**: Works with English and Chinese queries
- **Batch Operations**: Query multiple users at once with natural language

### ⏰ Smart Status System
- **6 Status Types**: `on_duty`, `off_duty`, `on_leave`, `wfh`, `out`, `meeting`
- **Time-Based Automation**: Automatic status switching based on work hours (08:30-17:30)
- **Persistent User Settings**: AI-modified statuses override automatic logic until manually refreshed
- **Complete History Tracking**: Full audit trail of all status changes with timestamps

### 👥 Multi-User Simulation
- **User Authentication**: Simple login/logout system with user switching
- **Mock Data System**: Pre-populated with sample employees and departments
- **Real-time Updates**: Immediate status synchronization across the interface
- **Dashboard Overview**: Visual status display for all team members

### 🎨 Modern Interface
- **Chat-First Design**: Primary interaction through conversational AI interface
- **Responsive Layout**: Clean, intuitive design with Tailwind CSS v4
- **Status Visualization**: Color-coded status indicators and detailed popovers
- **Cross-Platform**: Native desktop experience on Windows, macOS, and Linux

## Tech Stack

### Core Technologies
- **Frontend Framework**: Vue 3 with Composition API and TypeScript
- **Desktop Platform**: Electron v37.3.0 for cross-platform desktop apps
- **State Management**: Pinia for reactive state management
- **Routing**: Vue Router v4 with hash-based navigation
- **Build System**: electron-vite combining Vite with Electron tooling

### AI & Data Integration
- **AI Framework**: Model Context Protocol (MCP) SDK v1.17.5
- **AI Provider**: OpenAI API for natural language processing
- **Data Storage**: electron-store for local data persistence
- **Mock Data**: Comprehensive user and status simulation system

### UI & Styling
- **CSS Framework**: Tailwind CSS v4 with custom configuration
- **Icons**: Lucide Vue Next + @egoist/tailwindcss-icons
- **Components**: Reka UI for accessible component primitives
- **Animations**: tw-animate-css for smooth transitions
- **Utilities**: VueUse for composition utilities and DOM manipulation

### Development Tools
- **Type Checking**: TypeScript with strict mode enabled
- **Code Quality**: ESLint with @antfu/eslint-config
- **Package Manager**: npm with electron-builder for distribution
- **Testing**: Vitest for unit testing framework

## Prerequisites

- **Node.js**: Version 18.x or higher
- **npm**: Version 8.x or higher  
- **OpenAI API Key**: Required for AI-powered features

### Environment Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd the-weasley-tracker
   ```

2. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

3. **Configure OpenAI API**:
   Edit `.env` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

## Project Setup

### Install Dependencies

```bash
npm install
```

### Development

**Start the development server**:
```bash
npm run dev
```

This command starts both the Electron app and the MCP server for AI functionality.

**Additional development commands**:
```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## Usage

### Getting Started

1. **Launch the application**:
   ```bash
   npm run dev
   ```

2. **Login**: Choose from pre-configured mock users (e.g., "John Doe", "Jane Smith")

3. **AI Chat Interface**: The main interface where you interact with the AI assistant

### AI Interaction Examples

**Status Queries**:
```
"What is John doing?"
"Who is currently in meetings?"
"有誰正在會議中?" (Chinese)
"Show me everyone's current status"
"小王、小李、小陳現在的狀態是?"
```

**Status Updates**:
```
"I'm going out for lunch, back at 2 PM"
"Set my status to working from home"
"I'm in a meeting until 4:30"
"我要外出，下午3點回來" (Chinese)
```

**Batch Operations**:
```
"Who is working from home today?"
"List everyone who is currently on duty"
"Show me all off-duty employees"
```

### Navigation

- **Chat Page** (`/chat`): Primary AI interaction interface (default after login)
- **Dashboard** (`/dashboard`): Visual overview of all team member statuses
- **Settings**: User profile and application preferences

### Status Types

| Status | Description | Auto-Applied |
|--------|-------------|-------------|
| `on_duty` | Working during business hours | ✅ 08:30-17:30 |
| `off_duty` | Outside business hours | ✅ Before 08:30, After 17:30 |
| `on_leave` | Taking leave/vacation | ❌ Manual only |
| `wfh` | Working from home | ❌ Manual only |
| `out` | Temporarily away | ❌ Manual only |
| `meeting` | In meetings | ❌ Manual only |

### Build for Production

```bash
# Type check and build
npm run build

# Build for specific platforms
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux

# Build unpacked (for testing)
npm run build:unpack

# Preview built application
npm start
```

## Project Structure

```
src/
├── main/                 # Electron main process
│   ├── index.ts         # Application entry point
│   ├── stores/          # Data storage management
│   ├── services/        # MCP service integration
│   └── mcp/             # MCP server and tools
├── preload/             # Secure IPC bridge
│   └── index.ts         # API exposure to renderer
├── renderer/            # Vue.js frontend application
│   └── src/
│       ├── components/  # Vue components
│       ├── pages/       # Route components
│       ├── stores/      # Pinia state management
│       ├── types/       # TypeScript type definitions
│       └── router/      # Vue Router configuration
└── shared/              # Shared utilities and types
    ├── types.ts         # Common TypeScript interfaces
    └── mockData.ts      # Mock user data generation
```

### Key Components

- **MCP Integration**: `src/main/mcp/` - AI service communication
- **Status Management**: `src/main/stores/DataStore.ts` - Core business logic
- **Chat Interface**: `src/renderer/src/pages/Chat.vue` - AI conversation UI
- **Status Dashboard**: `src/renderer/src/pages/Dashboard.vue` - Team overview
- **Mock Data System**: `src/shared/mockData.ts` - Sample user generation

## Development

### Architecture Overview

The application follows a modern Electron architecture with clear separation of concerns:

1. **Main Process**: Handles system integration, data storage, and MCP server communication
2. **Renderer Process**: Vue.js application providing the user interface
3. **Preload Scripts**: Secure bridge for IPC communication between processes
4. **MCP Server**: Independent AI service for natural language processing

### Data Flow

1. User input → Vue components → Pinia stores → IPC → Main process
2. Main process → MCP server → OpenAI API → Response processing
3. Status updates → electron-store → Real-time UI updates

### Contributing

This is an MVP demonstration project. The codebase follows:

- **TypeScript strict mode** for type safety
- **ESLint with @antfu/eslint-config** for code quality
- **Vue 3 Composition API** for reactive components
- **Tailwind CSS v4** for consistent styling

## License

MIT License - See LICENSE file for details.
