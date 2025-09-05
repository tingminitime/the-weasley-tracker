# API Key Management and Environment Configuration

## Development Environment (.env file)
- **Location**: `.env` file in project root
- **Example**: `.env.example` shows required format
- **Key Variables**:
  - `OPENAI_API_KEY=sk-your-openai-api-key-here`
  - `MCP_SERVER_PORT=3000`
  - `MCP_SERVER_HOST=localhost`
  - `NODE_ENV=development`

## Environment Loading System
- **Class**: `Environment` in `src/main/utils/Environment.ts`
- **Features**:
  - Automatic .env file loading using dotenv
  - Singleton pattern with `loaded` flag
  - Validation of required keys
  - Type-safe getters for each environment variable

## API Key Flow in Application
1. **App Startup** (`src/main/index.ts`):
   - `Environment.getOpenAiApiKey()` reads from .env
   - `McpService.initialize(apiKey)` initializes OpenAI client
   - If no API key: runs without LLM capabilities (warning logged)

2. **MCP Client** (`src/main/mcp/client.ts`):
   - Creates OpenAI instance only if API key provided
   - `hasLLMCapability()` returns false if no OpenAI instance

## Production Build Considerations
- **.env file is NOT bundled** with production builds
- **Issue**: Production builds cannot access .env file
- **Current Gap**: No user-facing API key configuration system
- **Potential Solutions**:
  - Settings page for API key input
  - First-run setup wizard  
  - Secure storage using electron-store
  - Environment variable injection at runtime