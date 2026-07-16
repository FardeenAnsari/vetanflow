import { createClient } from '@supabase/supabase-js'
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import WebSocket from 'ws'

const root = process.cwd()
const appUrl = process.env.DEMO_APP_URL ?? 'http://127.0.0.1:5173/app'
const outputDir = resolve(root, process.env.DEMO_SCREENSHOT_DIR ?? 'docs/screenshots')
const timeoutMs = Number(process.env.DEMO_SCREENSHOT_TIMEOUT_MS ?? 30_000)
const credentialPath = join(root, '.tmp/demo-credentials.json')

const viewports = [
  { label: 'desktop', width: 1440, height: 1000, mobile: false },
  { label: 'mobile', width: 500, height: 844, mobile: true },
]

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return
  }

  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue
    }

    const [key, ...valueParts] = trimmed.split('=')
    process.env[key.trim()] ??= valueParts.join('=').trim().replace(/^['"]|['"]$/g, '')
  }
}

function requiredEnv(name, fallbackName) {
  const value = process.env[name] ?? (fallbackName ? process.env[fallbackName] : undefined)

  if (!value) {
    throw new Error(`${name}${fallbackName ? ` or ${fallbackName}` : ''} must be set.`)
  }

  return value
}

function normalizePeriodMonth(value) {
  const parsed = new Date(`${value}T00:00:00.000Z`)

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid DEMO_PERIOD_MONTH: ${value}`)
  }

  return `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, '0')}-01`
}

function getDefaultDemoPeriodMonth() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString().slice(0, 10)
}

function getMonthBounds(month) {
  const start = new Date(`${month}T00:00:00.000Z`)
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0))

  return {
    endDate: end.toISOString().slice(0, 10),
    startDate: month,
  }
}

function findExecutable(command) {
  const paths = (process.env.PATH ?? '').split(':')

  for (const directory of paths) {
    const candidate = join(directory, command)

    if (existsSync(candidate)) {
      return candidate
    }
  }

  return ''
}

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    findExecutable('google-chrome'),
    findExecutable('chromium'),
    findExecutable('chromium-browser'),
    findExecutable('microsoft-edge'),
  ].filter(Boolean)

  return candidates.find((candidate) => existsSync(candidate)) ?? ''
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      server.close(() => resolve(address.port))
    })
  })
}

async function waitForJson(url) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url)

      if (response.ok) {
        return await response.json()
      }
    } catch {
      // Chrome may still be starting.
    }

    await delay(200)
  }

  throw new Error(`Timed out waiting for ${url}`)
}

class CdpSession {
  constructor(url) {
    this.nextId = 1
    this.pending = new Map()
    this.events = new Map()
    this.ws = new WebSocket(url)
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.ws.once('open', resolve)
      this.ws.once('error', reject)
    })

    this.ws.on('message', (message) => {
      const payload = JSON.parse(message.toString())

      if (payload.id) {
        const pending = this.pending.get(payload.id)
        this.pending.delete(payload.id)

        if (payload.error) {
          pending?.reject(new Error(payload.error.message))
        } else {
          pending?.resolve(payload.result)
        }

        return
      }

      const listeners = this.events.get(payload.method) ?? []
      for (const listener of listeners) {
        listener(payload.params)
      }
    })
  }

  send(method, params = {}) {
    const id = this.nextId++

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }

  once(method) {
    return new Promise((resolve) => {
      const listener = (params) => {
        this.events.set(
          method,
          (this.events.get(method) ?? []).filter((candidate) => candidate !== listener),
        )
        resolve(params)
      }

      this.events.set(method, [...(this.events.get(method) ?? []), listener])
    })
  }

  close() {
    this.ws.close()
  }
}

async function launchBrowser(browser, viewport) {
  const port = await getFreePort()
  const userDataDir = mkdtempSync(join(tmpdir(), `vetanflow-auth-shot-${viewport.label}-`))
  const process = spawn(browser, [
    '--headless=new',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-allow-origins=*',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    `--window-size=${viewport.width},${viewport.height}`,
    'about:blank',
  ])

  const pageTarget = await waitForPageTarget(port)

  return { pageTarget, process }
}

async function waitForPageTarget(port) {
  await waitForJson(`http://127.0.0.1:${port}/json/version`)

  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    const targets = await waitForJson(`http://127.0.0.1:${port}/json/list`)
    const pageTarget = targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl)

    if (pageTarget) {
      return pageTarget
    }

    await delay(200)
  }

  throw new Error('Timed out waiting for a Chrome page target.')
}

async function stopBrowser(process) {
  if (process.exitCode != null) {
    return
  }

  process.kill('SIGTERM')

  await Promise.race([
    new Promise((resolve) => process.once('exit', resolve)),
    delay(2_000).then(() => {
      if (process.exitCode == null) {
        process.kill('SIGKILL')
      }
    }),
  ])
}

async function waitForText(cdp, text, label) {
  const startedAt = Date.now()
  let lastBodyText = ''

  while (Date.now() - startedAt < timeoutMs) {
    const response = await cdp.send('Runtime.evaluate', {
      expression: 'document.body?.innerText ?? ""',
      returnByValue: true,
    })
    const bodyText = response.result?.value ?? ''
    lastBodyText = bodyText

    if (bodyText.includes(text)) {
      return
    }

    await delay(500)
  }

  throw new Error(
    `Expected text "${text}" was not found for ${label}. Visible page text: ${JSON.stringify(lastBodyText.slice(0, 500))}`,
  )
}

async function query(label, request) {
  const { data, error } = await request

  if (error) {
    throw new Error(`${label}: ${error.message}`)
  }

  return data
}

async function validateDemoAccess(serviceClient, ownerUserId, employeeUserId) {
  const period = getMonthBounds(
    normalizePeriodMonth(process.env.DEMO_PERIOD_MONTH ?? getDefaultDemoPeriodMonth()),
  )
  const ownerProfiles = await query(
    'owner profile',
    serviceClient.from('profiles').select('organization_id').eq('id', ownerUserId).limit(1),
  )
  const ownerProfile = ownerProfiles[0]

  if (!ownerProfile) {
    throw new Error('The owner account is not linked to an organization. Run npm run demo:seed-showcase first.')
  }

  const ownerRoles = await query(
    'owner role',
    serviceClient
      .from('user_roles')
      .select('role')
      .eq('organization_id', ownerProfile.organization_id)
      .eq('user_id', ownerUserId)
      .eq('role', 'owner'),
  )

  if (!ownerRoles.length) {
    throw new Error('The screenshot owner account does not have the owner role.')
  }

  const latestRuns = await query(
    'demo finalized payroll run',
    serviceClient
      .from('payroll_runs')
      .select('id')
      .eq('organization_id', ownerProfile.organization_id)
      .eq('status', 'finalized')
      .eq('period_start', period.startDate)
      .eq('period_end', period.endDate)
      .limit(1),
  )
  const demoRun = latestRuns[0]

  if (!demoRun) {
    throw new Error(`No finalized payroll run found for ${period.startDate} to ${period.endDate}. Run npm run demo:prepare first.`)
  }

  const employees = await query(
    'employee for demo account',
    serviceClient
      .from('employees')
      .select('id,full_name')
      .eq('organization_id', ownerProfile.organization_id)
      .eq('profile_id', employeeUserId)
      .limit(1),
  )
  const employee = employees[0]

  if (!employee) {
    throw new Error('The employee demo account is not linked to an employee record.')
  }

  const lines = await query(
    'employee payroll lines',
    serviceClient
      .from('payroll_run_lines')
      .select('id')
      .eq('payroll_run_id', demoRun.id)
      .eq('employee_id', employee.id),
  )

  if (!lines.length) {
    throw new Error(`No payroll line found for ${employee.full_name} in ${period.startDate}.`)
  }

  const payslips = await query(
    'published employee payslip',
    serviceClient
      .from('payslips')
      .select('id')
      .in('payroll_run_line_id', lines.map((line) => line.id))
      .not('published_at', 'is', null),
  )

  if (!payslips.length) {
    throw new Error(`No published payslip found for ${employee.full_name} in ${period.startDate}.`)
  }

  return employee.full_name
}

async function signIn(publicClient, email, password) {
  const { data, error } = await publicClient.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.session) {
    throw new Error(`Could not sign in ${email}: ${error?.message ?? 'missing session'}`)
  }

  return data.session
}

async function captureSession({ browser, expectedText, postPrepareExpectedText, preparePage, prefix, session, storageKey, viewport }) {
  const { pageTarget, process } = await launchBrowser(browser, viewport)
  const cdp = new CdpSession(pageTarget.webSocketDebuggerUrl)

  try {
    await cdp.open()
    await cdp.send('Page.enable')
    await cdp.send('Runtime.enable')
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      deviceScaleFactor: 1,
      height: viewport.height,
      mobile: viewport.mobile,
      width: viewport.width,
    })

    const initialLoad = cdp.once('Page.loadEventFired')
    await cdp.send('Page.navigate', { url: appUrl })
    await initialLoad

    await cdp.send('Runtime.evaluate', {
      expression: `localStorage.setItem(${JSON.stringify(storageKey)}, ${JSON.stringify(JSON.stringify(session))})`,
    })

    const authenticatedLoad = cdp.once('Page.loadEventFired')
    await cdp.send('Page.navigate', { url: appUrl })
    await authenticatedLoad
    await waitForText(cdp, expectedText, `${prefix}-${viewport.label}`)

    if (preparePage) {
      await cdp.send('Runtime.evaluate', { expression: preparePage })
    }

    if (postPrepareExpectedText) {
      await waitForText(cdp, postPrepareExpectedText, `${prefix}-${viewport.label}`)
    }

    await delay(1_000)

    const screenshot = await cdp.send('Page.captureScreenshot', {
      captureBeyondViewport: false,
      format: 'png',
    })
    const outputPath = join(outputDir, `${prefix}-${viewport.label}.png`)
    writeFileSync(outputPath, Buffer.from(screenshot.data, 'base64'))
    console.log(`Captured ${outputPath}`)
  } finally {
    cdp.close()
    await stopBrowser(process)
  }
}

loadEnvFile(join(root, 'backend/.env'))
loadEnvFile(join(root, 'frontend/.env'))

const supabaseUrl = requiredEnv('SUPABASE_URL', 'VITE_SUPABASE_URL')
const publishableKey = requiredEnv('SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_PUBLISHABLE_KEY')
const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY')
const browser = findBrowser()

if (!browser) {
  throw new Error('Chrome, Edge, or Chromium was not found. Set CHROME_PATH to the browser executable.')
}

mkdirSync(outputDir, { recursive: true })

const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`
const clientOptions = {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: WebSocket },
}
const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
  ...clientOptions,
})
const publicClient = createClient(supabaseUrl, publishableKey, {
  ...clientOptions,
})

if (!existsSync(credentialPath)) {
  throw new Error('Missing .tmp/demo-credentials.json. Run npm run demo:seed-showcase first.')
}

const storedCredentials = JSON.parse(readFileSync(credentialPath, 'utf8')).users
const ownerCredential = storedCredentials.find((credential) => credential.role === 'owner')
const employeeCredential = storedCredentials.find((credential) => credential.role === 'employee')

if (!ownerCredential || !employeeCredential) {
  throw new Error('The local demo credential file must contain owner and employee accounts.')
}

const ownerEmail = process.env.DEMO_OWNER_EMAIL ?? ownerCredential.email
const employeeEmail = process.env.DEMO_EMPLOYEE_EMAIL ?? employeeCredential.email
const ownerPassword = process.env.DEMO_OWNER_PASSWORD ?? ownerCredential.password
const employeePassword = process.env.DEMO_EMPLOYEE_PASSWORD ?? employeeCredential.password
const periodMonth = normalizePeriodMonth(process.env.DEMO_PERIOD_MONTH ?? getDefaultDemoPeriodMonth())
const periodOptionValue = periodMonth.slice(0, 7)
const ownerPayrollView = `
(() => {
  window.location.hash = 'payroll';
  window.setTimeout(() => {
    const headings = Array.from(document.querySelectorAll('h2, h3'));
    const target = headings.find((heading) => heading.textContent?.includes('Payroll runs'));
    target?.scrollIntoView({ block: 'start' });
    window.scrollBy(0, -88);
    const periodSelect = Array.from(document.querySelectorAll('select'))
      .find((select) => Array.from(select.options).some((option) => option.value === '${periodOptionValue}'));
    if (periodSelect) {
      const valueSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
      valueSetter?.call(periodSelect, '${periodOptionValue}');
      periodSelect.dispatchEvent(new Event('change', { bubbles: true }));
      window.setTimeout(() => {
        const preparedRun = Array.from(document.querySelectorAll('button'))
          .find((button) => button.textContent?.includes('${periodMonth.slice(0, 4)}'));
        preparedRun?.click();
        target?.scrollIntoView({ block: 'start' });
        window.scrollBy(0, -88);
      }, 300);
    }
  }, 300);
})()
`

const ownerSession = await signIn(publicClient, ownerEmail, ownerPassword)
const employeeSession = await signIn(publicClient, employeeEmail, employeePassword)
await validateDemoAccess(serviceClient, ownerSession.user.id, employeeSession.user.id)

for (const viewport of viewports) {
  await captureSession({
    browser,
    expectedText: 'Owner workspace',
    postPrepareExpectedText: 'Run history',
    preparePage: ownerPayrollView,
    prefix: 'owner',
    session: ownerSession,
    storageKey,
    viewport,
  })
}

for (const viewport of viewports) {
  await captureSession({
    browser,
    expectedText: 'Download',
    prefix: 'employee',
    session: employeeSession,
    storageKey,
    viewport,
  })
}

console.log('Authenticated demo screenshots captured.')
