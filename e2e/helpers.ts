import { Page } from '@playwright/test'
import path from 'path'

export async function captureScreenshot(page: Page, name: string): Promise<void> {
  const screenshotPath = path.join(__dirname, 'screenshots', `${name}.png`)
  await page.screenshot({ path: screenshotPath, fullPage: true })
}

export async function assertNoConsoleErrors(page: Page): Promise<void> {
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })
  // Allow a moment for any deferred errors
  await page.waitForTimeout(200)
  if (errors.length > 0) {
    throw new Error(`Console errors detected:\n${errors.join('\n')}`)
  }
}
