import * as path from 'node:path'
import * as dotenv from 'dotenv'

export class Environment {
  private static loaded = false

  static load(): void {
    if (this.loaded)
      return

    // Load .env file from project root
    const envPath = path.resolve(process.cwd(), '.env')
    dotenv.config({ path: envPath })

    this.loaded = true
    console.log('Environment variables loaded')
  }

  static getOpenAiApiKey(): string | undefined {
    this.load()
    return process.env.OPENAI_API_KEY
  }

  static getMcpServerPort(): number {
    this.load()
    return Number.parseInt(process.env.MCP_SERVER_PORT || '3000', 10)
  }

  static getMcpServerHost(): string {
    this.load()
    return process.env.MCP_SERVER_HOST || 'localhost'
  }

  static isDevelopment(): boolean {
    this.load()
    return process.env.NODE_ENV === 'development' || process.env.ELECTRON_DEV === 'true'
  }

  static validateRequiredKeys(): { isValid: boolean, missing: string[] } {
    this.load()

    const requiredKeys = ['OPENAI_API_KEY']
    const missing: string[] = []

    for (const key of requiredKeys) {
      if (!process.env[key]) {
        missing.push(key)
      }
    }

    return {
      isValid: missing.length === 0,
      missing,
    }
  }
}
