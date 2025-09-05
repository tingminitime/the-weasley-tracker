# Development Commands

## Essential Commands
- **Install dependencies**: `pnpm install`
- **Start development**: `pnpm dev`
- **Build for production**: `pnpm build`
- **Type checking**: `pnpm typecheck` (runs both node and web type checks)
- **Linting**: `pnpm lint`
- **Preview built app**: `pnpm start`

## Build for Distribution
- **Windows**: `pnpm build:win`
- **macOS**: `pnpm build:mac` 
- **Linux**: `pnpm build:linux`
- **Unpacked build**: `pnpm build:unpack`

## Quality Assurance Commands
- **Type check (node)**: `pnpm typecheck:node`
- **Type check (web)**: `pnpm typecheck:web`
- **Lint with cache**: `pnpm lint:cache`
- **Lint and fix**: `pnpm lint:fix`

## System Commands (Linux)
- **List files**: `ls`
- **Change directory**: `cd`
- **Search in files**: `grep` or `rg` (ripgrep)
- **Find files**: `find`
- **Git operations**: `git`

## Environment Setup
- Copy `.env.example` to `.env`
- Set `OPENAI_API_KEY` in `.env` file for AI functionality