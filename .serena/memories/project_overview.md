# The Weasley Tracker - Project Overview

## Purpose
**The Weasley Tracker** (查勤魔法) is an MVP Electron desktop application inspired by the Weasley Clock from Harry Potter. The application tracks employee attendance and status with AI-powered natural language interaction.

## Tech Stack
- **Frontend**: Vue 3 (TypeScript) + Vue Router v4 + Pinia
- **Desktop Framework**: Electron v37.3.0 
- **Styling**: Tailwind CSS v4 with @egoist/tailwindcss-icons
- **Build System**: electron-vite (combines Vite with Electron tooling)
- **Data Storage**: electron-store for local persistence
- **AI Integration**: @modelcontextprotocol/sdk + OpenAI API
- **Package Manager**: pnpm

## Key Architecture Components
- **Main Process**: TypeScript (`src/main/index.ts`)
- **Renderer Process**: Vue 3 + TypeScript (`src/renderer/`)
- **Preload Script**: TypeScript (`src/preload/index.ts`)
- **MCP Integration**: Custom MCP service for AI communication
- **Environment Management**: Custom Environment class for config

## Core Features
- 6 Status Types: `on_duty`, `off_duty`, `on_leave`, `wfh`, `out`, `meeting`
- Time-based automatic status (08:30-17:30 schedule)
- AI-powered natural language queries and status updates
- Multi-user simulation with mock data
- Real-time status updates through AI conversation
- Status history tracking with timestamps