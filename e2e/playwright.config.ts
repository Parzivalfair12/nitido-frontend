import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './pruebas',
  // Los flujos comparten una sola API y una sola base: se corren de a uno para que los códigos TOTP no se pisen.
  workers: 1,
  timeout: 90_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  expect: { toHaveScreenshot: { animations: 'disabled' } },
  use: {
    baseURL: process.env.NITIDO_URL ?? 'http://localhost:4200',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'computador',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'celular',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
