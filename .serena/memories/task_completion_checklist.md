# Task Completion Checklist

## After Making Code Changes
1. **Type checking**: Run `pnpm typecheck` to ensure no TypeScript errors
2. **Linting**: Run `pnpm lint` to check code style and catch issues
3. **Testing**: Currently no test scripts defined - verify manually
4. **Build verification**: Run `pnpm build` to ensure production build works

## Before Deployment
1. Ensure `.env` file has valid `OPENAI_API_KEY`
2. Verify MCP server functionality works
3. Test AI conversation flows
4. Check electron-store data persistence
5. Validate build artifacts in `out/` directory

## Code Quality Standards
- TypeScript strict mode enabled
- ESLint with Antfu's config enforced
- Vue components must use `<script setup lang="ts">`
- Console statements produce warnings
- Unused imports/variables produce warnings
- HTML self-closing tags enforced for components, never for HTML elements