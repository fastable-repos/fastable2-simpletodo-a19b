import { test, expect } from '@playwright/test'
import { captureScreenshot } from './helpers'

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function addTodo(page: import('@playwright/test').Page, text: string) {
  await page.getByLabel('New todo input').fill(text)
  await page.keyboard.press('Enter')
}

async function clearStorage(page: import('@playwright/test').Page) {
  await page.evaluate(() => localStorage.clear())
  await page.reload()
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('SimpleTodo App', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Start fresh each test
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForSelector('[aria-label="New todo input"]')
  })

  // ── Happy path: add a todo ──────────────────────────────────────────────────
  test('1. user adds a todo by pressing Enter and it appears with active count', async ({ page }) => {
    const input = page.getByLabel('New todo input')

    // Count should not exist yet (no todos)
    await expect(page.getByLabel('Active todo count')).not.toBeVisible()

    // Type and press Enter
    await input.fill('Buy groceries')
    await page.keyboard.press('Enter')

    // Todo appears
    await expect(page.getByText('Buy groceries')).toBeVisible()

    // Active count shows 1
    await expect(page.getByLabel('Active todo count')).toContainText('1')

    // Input is cleared
    await expect(input).toHaveValue('')

    // Checkbox is unchecked
    const checkbox = page.getByRole('checkbox', { name: /Mark "Buy groceries" as complete/ })
    await expect(checkbox).toBeVisible()
    await expect(checkbox).toHaveAttribute('aria-checked', 'false')

    // Add a second via button
    await input.fill('Walk the dog')
    await page.getByLabel('Add todo').click()
    await expect(page.getByText('Walk the dog')).toBeVisible()
    await expect(page.getByLabel('Active todo count')).toContainText('2')
  })

  // ── Happy path: complete a todo ────────────────────────────────────────────
  test('2. user marks a todo complete — strikethrough, count decrements, shows in Completed filter', async ({ page }) => {
    await addTodo(page, 'Read a book')
    await addTodo(page, 'Write code')

    // Initially 2 active
    await expect(page.getByLabel('Active todo count')).toContainText('2')

    // Click checkbox on "Read a book"
    await page.getByRole('checkbox', { name: /Mark "Read a book" as complete/ }).click()

    // Active count decrements to 1
    await expect(page.getByLabel('Active todo count')).toContainText('1')

    // Text has strikethrough (line-through class)
    const todoText = page.locator('li').filter({ hasText: 'Read a book' }).locator('span')
    await expect(todoText).toHaveClass(/line-through/)

    // Switch to Completed filter
    await page.getByRole('button', { name: 'completed' }).click()
    await expect(page.getByText('Read a book')).toBeVisible()
    await expect(page.getByText('Write code')).not.toBeVisible()

    await captureScreenshot(page, 'completed-filter')
  })

  // ── Happy path: delete a todo ──────────────────────────────────────────────
  test('3. user deletes a todo and it is removed from the list', async ({ page }) => {
    await addTodo(page, 'Clean the house')
    await addTodo(page, 'Go for a run')

    await expect(page.getByText('Clean the house')).toBeVisible()

    // Hover the item to reveal the delete button, then click it
    const item = page.locator('li').filter({ hasText: 'Clean the house' })
    await item.hover()
    await item.getByLabel('Delete "Clean the house"').click()

    // Todo is gone
    await expect(page.getByText('Clean the house')).not.toBeVisible()
    // Other todo remains
    await expect(page.getByText('Go for a run')).toBeVisible()
    // Active count decremented
    await expect(page.getByLabel('Active todo count')).toContainText('1')
  })

  // ── Happy path: clear completed ────────────────────────────────────────────
  test('4. Clear Completed removes all completed todos while keeping active ones', async ({ page }) => {
    await addTodo(page, 'Active task')
    await addTodo(page, 'Done task 1')
    await addTodo(page, 'Done task 2')

    // Complete two of them
    await page.getByRole('checkbox', { name: /Mark "Done task 1" as complete/ }).click()
    await page.getByRole('checkbox', { name: /Mark "Done task 2" as complete/ }).click()

    await expect(page.getByLabel('Active todo count')).toContainText('1')

    // Clear completed
    await page.getByText('Clear Completed').click()

    // Completed todos are gone
    await expect(page.getByText('Done task 1')).not.toBeVisible()
    await expect(page.getByText('Done task 2')).not.toBeVisible()

    // Active todo remains
    await expect(page.getByText('Active task')).toBeVisible()
    await expect(page.getByLabel('Active todo count')).toContainText('1')

    // Clear Completed button disappears (no completed todos left)
    await expect(page.getByText('Clear Completed')).not.toBeVisible()
  })

  // ── Edge case: empty/whitespace todo ──────────────────────────────────────
  test('5. empty or whitespace-only todo is not added', async ({ page }) => {
    const input = page.getByLabel('New todo input')

    // Press Enter with empty input
    await input.fill('')
    await page.keyboard.press('Enter')
    await expect(page.getByLabel('Active todo count')).not.toBeVisible()

    // Press Enter with whitespace only
    await input.fill('   ')
    await page.keyboard.press('Enter')
    await expect(page.getByLabel('Active todo count')).not.toBeVisible()

    // Click Add button with whitespace
    await input.fill('  ')
    await page.getByLabel('Add todo').click()
    await expect(page.getByLabel('Active todo count')).not.toBeVisible()

    // List still shows empty state message
    await expect(page.getByText('No todos yet — add one above!')).toBeVisible()
  })

  // ── Edge case: filter tabs ────────────────────────────────────────────────
  test('6. filter tabs correctly show All / Active / Completed todos', async ({ page }) => {
    await addTodo(page, 'Task A')
    await addTodo(page, 'Task B')
    await addTodo(page, 'Task C')

    // Mark Task B complete
    await page.getByRole('checkbox', { name: /Mark "Task B" as complete/ }).click()

    // ALL filter (default) — all three visible
    await page.getByRole('button', { name: 'all' }).click()
    await expect(page.getByText('Task A')).toBeVisible()
    await expect(page.getByText('Task B')).toBeVisible()
    await expect(page.getByText('Task C')).toBeVisible()

    // ACTIVE filter — only A and C
    await page.getByRole('button', { name: 'active' }).click()
    await expect(page.getByText('Task A')).toBeVisible()
    await expect(page.getByText('Task B')).not.toBeVisible()
    await expect(page.getByText('Task C')).toBeVisible()

    // COMPLETED filter — only B
    await page.getByRole('button', { name: 'completed' }).click()
    await expect(page.getByText('Task A')).not.toBeVisible()
    await expect(page.getByText('Task B')).toBeVisible()
    await expect(page.getByText('Task C')).not.toBeVisible()

    await captureScreenshot(page, 'filter-tabs')
  })

  // ── Data persistence ──────────────────────────────────────────────────────
  test('7. todos persist across page refresh', async ({ page }) => {
    await addTodo(page, 'Persistent task 1')
    await addTodo(page, 'Persistent task 2')
    await addTodo(page, 'Persistent task 3')

    // Mark one complete
    await page.getByRole('checkbox', { name: /Mark "Persistent task 2" as complete/ }).click()

    // Reload the page
    await page.reload()
    await page.waitForSelector('[aria-label="New todo input"]')

    // All todos still present
    await expect(page.getByText('Persistent task 1')).toBeVisible()
    await expect(page.getByText('Persistent task 2')).toBeVisible()
    await expect(page.getByText('Persistent task 3')).toBeVisible()

    // Completion state preserved
    const completedText = page.locator('li').filter({ hasText: 'Persistent task 2' }).locator('span')
    await expect(completedText).toHaveClass(/line-through/)

    // Active count correct (2 active)
    await expect(page.getByLabel('Active todo count')).toContainText('2')
  })

  // ── Screenshot: main view ─────────────────────────────────────────────────
  test('screenshot: main list view with mixed todos', async ({ page }) => {
    await addTodo(page, 'Go to the gym')
    await addTodo(page, 'Buy coffee beans')
    await addTodo(page, 'Read documentation')
    await addTodo(page, 'Deploy the app')

    // Mark some complete
    await page.getByRole('checkbox', { name: /Mark "Go to the gym" as complete/ }).click()
    await page.getByRole('checkbox', { name: /Mark "Read documentation" as complete/ }).click()

    await captureScreenshot(page, 'main-list-view')
  })

  // ── Screenshot: empty state ───────────────────────────────────────────────
  test('screenshot: empty state shows friendly message', async ({ page }) => {
    // localStorage already cleared in beforeEach
    await expect(page.getByText('No todos yet — add one above!')).toBeVisible()
    await captureScreenshot(page, 'empty-state')
  })

})
