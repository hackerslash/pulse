import { defineConfig, devices } from '@playwright/test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const java = process.env.JAVA_HOME ? `${process.env.JAVA_HOME}/bin/java` : 'java'
const data = mkdtempSync(join(tmpdir(), 'pulse-e2e-'))

export default defineConfig({
  testDir: '.',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://localhost:15173', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 960 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
  ],
  webServer: [
    {
      command: `${java} -jar ../backend/target/pulse-0.0.1-SNAPSHOT.jar --server.port=18080 --pulse.tick=1s --pulse.password=e2e-pass`,
      env: { PULSE_DATA: data },
      url: 'http://localhost:18080/actuator/health',
      timeout: 180_000,
      reuseExistingServer: false,
    },
    {
      command: 'npm --prefix ../frontend run dev -- --port 15173 --strictPort',
      env: { API_URL: 'http://localhost:18080' },
      url: 'http://localhost:15173',
      timeout: 60_000,
      reuseExistingServer: false,
    },
  ],
})
