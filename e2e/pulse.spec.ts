import { expect, test, type Page } from '@playwright/test'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'

let server: Server
let status = 200
const hooks: any[] = []
let base = ''

test.beforeAll(async () => {
  server = createServer((req, res) => {
    let body = ''
    req.on('data', c => (body += c))
    req.on('end', () => {
      if (req.method === 'POST' && req.url === '/hook') hooks.push(JSON.parse(body))
      res.writeHead(req.url === '/hook' ? 200 : status).end('ok')
    })
  })
  await new Promise<void>(r => server.listen(0, '127.0.0.1', r))
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

test.afterAll(() => server.close())

const card = (page: Page, name: string) => page.getByTestId('monitor-card').filter({ hasText: name })

async function login(page: Page) {
  await page.goto('/admin')
  await page.getByLabel('Password').fill('e2e-pass')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Pulse', exact: true })).toBeVisible()
}

test('full lifecycle: add, alert via webhook, recover, pause, delete', async ({ page }) => {
  await page.goto('/admin')
  await expect(page.getByRole('heading', { name: 'Sign in to Pulse' })).toBeVisible()
  expect((await page.request.get('/api/monitors')).status()).toBe(401)
  await page.getByLabel('Password').fill('wrong')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('alert')).toHaveText('Wrong password')
  await page.screenshot({ path: 'screenshots/00-login.png' })
  await page.getByLabel('Password').fill('e2e-pass')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByText('Nothing to watch yet')).toBeVisible()
  await expect(page.getByTestId('health')).toHaveText(/No monitors yet/)
  await page.screenshot({ path: 'screenshots/01-empty.png' })

  // validation error surfaces from the API
  await page.getByRole('button', { name: /Add your first monitor/ }).click()
  await page.getByLabel('URL').fill('ftp://files.example.com')
  await page.getByRole('button', { name: 'Start monitoring' }).click()
  await expect(page.getByRole('alert')).toHaveText('url must start with http:// or https://')

  await page.getByLabel('URL').fill(base + '/health')
  await page.getByLabel(/Name/).fill('Checkout API')
  await page.getByRole('radio', { name: '30s' }).click()
  await page.screenshot({ path: 'screenshots/02-form.png' })
  await page.getByRole('button', { name: 'Start monitoring' }).click()
  await expect(page.getByText('Now watching Checkout API')).toBeVisible()

  await expect(card(page, 'Checkout API').locator('.badge')).toHaveText(/^Up · /)
  await expect(page.getByTestId('health')).toHaveText('All systems operational')
  await expect(card(page, 'Checkout API')).toContainText('every 30s')

  // webhook: add + test delivery
  await page.getByRole('button', { name: 'Webhooks' }).click()
  await page.getByLabel('Webhook name').fill('Ops channel')
  await page.getByLabel('Webhook URL').fill(base + '/hook')
  await page.getByRole('button', { name: 'Add' }).click()
  await expect(page.getByTestId('webhook')).toContainText('Ops channel')
  await page.getByRole('button', { name: 'Test' }).click()
  await expect(page.getByText('Test delivered (HTTP 200)')).toBeVisible()
  await expect(page.getByTestId('webhook')).toContainText('Delivered')
  expect(hooks.at(-1)).toMatchObject({ event: 'test' })
  await page.screenshot({ path: 'screenshots/03-webhooks.png' })
  await page.keyboard.press('Escape')

  // outage
  status = 503
  await card(page, 'Checkout API').click()
  await page.getByRole('button', { name: 'Check now' }).click()
  await expect(page.locator('.detail .badge')).toHaveText(/^Down for/)
  await expect(page.locator('.alert-strip')).toContainText('HTTP 503')
  await expect(page.locator('.detail')).toContainText('Ongoing')
  await page.screenshot({ path: 'screenshots/04-detail-down.png' })
  await page.keyboard.press('Escape')

  await expect(page.getByTestId('health')).toHaveText('1 service down')
  await expect(page.getByTestId('incident').first()).toContainText('Ongoing')
  await expect(page.getByTestId('incident').first()).toContainText('HTTP 503')
  await expect.poll(() => hooks.filter(h => h.event === 'down').length).toBe(1)
  const down = hooks.find(h => h.event === 'down')
  expect(down).toMatchObject({ error: 'HTTP 503', monitor: { name: 'Checkout API', url: base + '/health' } })
  expect(down.text).toContain('🔴 Checkout API is DOWN')
  await page.screenshot({ path: 'screenshots/05-dashboard-down.png' })

  // recovery
  status = 200
  await card(page, 'Checkout API').click()
  await page.getByRole('button', { name: 'Check now' }).click()
  await expect(page.locator('.detail .badge')).toHaveText(/^Up for/)
  await expect(page.locator('.detail')).toContainText('Resolved')
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('health')).toHaveText('All systems operational')
  await expect.poll(() => hooks.filter(h => h.event === 'up').length).toBe(1)
  expect(hooks.find(h => h.event === 'up').text).toContain('🟢 Checkout API is back UP')
  await expect(page.getByTestId('incident').first()).not.toContainText('Ongoing')

  // disabled webhooks don't fire
  await page.getByRole('button', { name: 'Webhooks' }).click()
  await page.getByLabel('Enable Ops channel').uncheck()
  await expect(page.getByLabel('Enable Ops channel')).not.toBeChecked()
  await page.keyboard.press('Escape')
  status = 500
  await card(page, 'Checkout API').click()
  await page.getByRole('button', { name: 'Check now' }).click()
  await expect(page.locator('.detail .badge')).toHaveText(/^Down for/)
  await page.waitForTimeout(500)
  expect(hooks.filter(h => h.event === 'down')).toHaveLength(1)
  status = 200

  // edit, pause, resume
  await page.getByRole('button', { name: 'Edit' }).click()
  await page.getByLabel(/Name/).fill('Checkout API v2')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.locator('.detail h2')).toHaveText('Checkout API v2')
  await page.getByRole('button', { name: 'Pause' }).click()
  await expect(page.locator('.detail .badge')).toHaveText('Paused')
  await page.getByRole('button', { name: 'Resume' }).click()
  await expect(page.locator('.detail .badge')).not.toHaveText('Paused')
  await page.keyboard.press('Escape')

  // search + filter
  await page.keyboard.press('/')
  await page.keyboard.type('nothing-matches')
  await expect(page.getByText('No monitors match.')).toBeVisible()
  await page.getByLabel('Search monitors').fill('v2')
  await expect(page.getByTestId('monitor-card')).toHaveCount(1)

  // delete
  await card(page, 'Checkout API v2').click()
  await page.getByRole('button', { name: 'Delete monitor' }).click()
  await page.getByRole('button', { name: 'Confirm delete' }).click()
  await expect(page.getByText('Monitor deleted')).toBeVisible()
  await expect(page.getByText('Nothing to watch yet')).toBeVisible()

  // session survives reload, logout ends it
  await page.reload()
  await expect(page.getByText('Nothing to watch yet')).toBeVisible()
  await page.getByRole('button', { name: 'Log out' }).click()
  await expect(page.getByRole('heading', { name: 'Sign in to Pulse' })).toBeVisible()
  expect((await page.request.get('/api/monitors')).status()).toBe(401)
})

test('public status page shows only public monitors, never URLs', async ({ page, browser }) => {
  await login(page)
  const mk = (name: string, path: string, isPublic: boolean) =>
    page.request.post('/api/monitors', { data: { name, url: base + path, intervalSeconds: 60, isPublic } })
  const ids = await Promise.all([mk('Website', '/site', true), mk('Payments API', '/pay', true), mk('Internal DB', '/db', false)])
    .then(rs => Promise.all(rs.map(async r => (await r.json()).id)))
  await expect(page.getByTestId('monitor-card')).toHaveCount(3)
  await expect(card(page, 'Internal DB').locator('.private')).toBeVisible()

  const visitor = await browser.newPage()
  await visitor.goto('/')
  await expect(visitor.getByTestId('status-banner')).toContainText('All systems operational')
  await expect(visitor.getByTestId('service')).toHaveCount(2)
  await expect(visitor.getByTestId('service').first()).toContainText('Payments API')
  await expect(visitor.getByTestId('service').first()).toHaveAttribute('data-status', 'UP')
  await expect(visitor.locator('body')).not.toContainText('Internal DB')
  await expect(visitor.locator('body')).not.toContainText('127.0.0.1')
  await expect(visitor.locator('.seg')).toHaveCount(180)
  await expect(visitor.getByRole('tab', { name: '1 day' })).toHaveAttribute('aria-selected', 'true')
  expect(visitor.url()).not.toContain('granularity')
  await visitor.getByRole('tab', { name: '1 week' }).click()
  await expect(visitor.locator('.seg')).toHaveCount(52)
  await expect(visitor.getByText('26 weeks ago')).toBeVisible()
  expect(visitor.url()).toContain('granularity=week')
  await visitor.getByRole('tab', { name: '1 month' }).click()
  await expect(visitor.locator('.seg')).toHaveCount(24)
  await expect(visitor.getByText('12 months ago')).toBeVisible()
  await visitor.getByRole('tab', { name: '1 day' }).click()
  await expect(visitor.locator('.seg')).toHaveCount(180)
  await expect(visitor.locator('.seg-up').first()).toBeAttached()
  expect((await visitor.request.get('/api/monitors')).status()).toBe(401)
  await visitor.screenshot({ path: 'screenshots/07-public.png', fullPage: true })

  status = 503
  await page.request.post(`/api/monitors/${ids[1]}/check`)
  await page.request.post(`/api/monitors/${ids[0]}/check`)
  await visitor.reload()
  await expect(visitor.getByTestId('status-banner')).toContainText('Major outage')
  await expect(visitor.getByText('Website outage')).toBeVisible()
  await expect(visitor.locator('.public-incidents')).not.toContainText('503')
  await visitor.screenshot({ path: 'screenshots/08-public-down.png', fullPage: true })
  status = 200

  await visitor.getByRole('link', { name: 'Admin' }).click()
  await expect(visitor.getByRole('heading', { name: 'Sign in to Pulse' })).toBeVisible()
  await visitor.close()
  for (const id of ids) await page.request.delete(`/api/monitors/${id}`)
})

test('keyboard shortcut and mobile layout @mobile', async ({ page }) => {
  await login(page)
  await page.request.post('/api/monitors', { data: { name: 'Docs', url: base + '/docs', intervalSeconds: 60 } })
  await expect(card(page, 'Docs').locator('.badge')).toHaveText(/^Up · /)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
  await page.screenshot({ path: `screenshots/06-${test.info().project.name}.png`, fullPage: true })
  await page.keyboard.press('n')
  await expect(page.getByRole('dialog', { name: 'New monitor' })).toBeVisible()
  await page.keyboard.press('Escape')
  const id = (await (await page.request.get('/api/monitors')).json()).find((v: any) => v.monitor.name === 'Docs').monitor.id
  await page.request.delete(`/api/monitors/${id}`)
})
