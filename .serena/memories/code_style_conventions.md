# Code Style and Conventions

## TypeScript Standards
- **Strict mode enabled** across all tsconfig files
- All Vue components must use `<script setup lang="ts">`
- Type hints required for function parameters and return types
- Interfaces preferred over type aliases for object shapes

## ESLint Configuration
- Uses **Antfu's ESLint config** with TypeScript and Vue support
- **better-tailwindcss plugin** for Tailwind CSS class organization
- Console statements produce **warnings** (not errors)
- Unused imports and variables produce **warnings**
- HTML self-closing tags enforced for components, **never** for HTML elements

## Vue.js Conventions
- **Composition API** with `<script setup>` syntax
- **Pinia** for state management
- **Vue Router v4** with hash-based navigation
- **VueUse composables** for reactive utilities

## Styling Guidelines
- **Tailwind CSS v4** with custom theme
- Component classes defined in `src/renderer/src/assets/main.css`
- **@egoist/tailwindcss-icons** plugin for icon support
- Class organization enforced by better-tailwindcss ESLint plugin

## File Organization
- `src/main/` - Electron main process (TypeScript)
- `src/preload/` - Preload scripts (TypeScript) 
- `src/renderer/` - Vue.js frontend (TypeScript + Vue)
- Path alias: `@renderer` points to `src/renderer/src`

## Naming Conventions
- **PascalCase** for Vue components and TypeScript classes
- **camelCase** for variables, functions, and methods
- **kebab-case** for file names and CSS classes
- **SCREAMING_SNAKE_CASE** for constants and environment variables

## Security Best Practices
- Never expose or log secrets/API keys
- Never commit secrets to repository
- Use preload scripts for secure IPC communication
- Sandbox disabled only where necessary for functionality