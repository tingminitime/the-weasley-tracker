# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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