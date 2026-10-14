import { defineConfig } from 'cypress'
// @ts-expect-error plain JS module
import { startServer } from './scripts/serve.mjs'

/**
 * Demo recording.
 *   LIVE (submission video):  CYPRESS_LLM_API_KEY=sk-... CYPRESS_LLM_MODEL=gpt-4.1-mini npm run cy:demo
 *   STUB (no key, CI):        npm run cy:demo   -> uses cypress/fixtures/llm-*.json (labelled as stub in the UI)
 * The video is written to cypress/videos/demo.cy.ts.mp4.
 */
export default defineConfig({
  video: true,
  videoCompression: 28,
  viewportWidth: 1440,
  viewportHeight: 900,
  defaultCommandTimeout: 10_000,
  chromeWebSecurity: false,
  e2e: {
    baseUrl: 'http://127.0.0.1:4173',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: false,
    async setupNodeEvents(_on, config) {
      await startServer(4173)
      return config
    },
  },
})
