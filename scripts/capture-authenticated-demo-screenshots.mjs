import { createClient } from '@supabase/supabase-js'
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import WebSocket from 'ws'

const root = process.cwd()
const appUrl = process.env.DEMO_APP_URL ?? 'http://127.0.0.1:5173/'
const outputDir = resolve(root, process.env.DEMO_SCREENSHOT_DIR ?? 'docs/screenshots')
const timeoutMs = Number(process.env.DEMO_SCREENSHOT_TIMEOUT_MS ?? 30_000)
const demoPassword = process.env.DEMO_AUTH_PASSWORD ?? `${randomBytes(18).toString('base64url')}Aa1!`

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

  while (Date.now() - startedAt < timeoutMs) {
    const response = await cdp.send('Runtime.evaluate', {
      expression: 'document.body?.innerText ?? ""',
      returnByValue: true,
    })
    const bodyText = response.result?.value ?? ''

    if (bodyText.includes(text)) {
      return
    }

    await delay(500)
  }

  throw new Error(`Expected text "${text}" was not found for ${label}.`)
}

async function query(label, request) {
  const { data, error } = await request

  if (error) {
    throw new Error(`${label}: ${error.message}`)
  }

  return data
}

async function findAuthUserByEmail(supabase, email) {
  let page = 1

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 })

    if (error) {
      throw new Error(`auth listUsers: ${error.message}`)
    }

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase())

    if (user) {
      return user
    }

    if (data.users.length < 100) {
      return null
    }

    page += 1
  }

  return null
}

async function ensureAuthUser(supabase, { email, fullName }) {
  const existing = await findAuthUserByEmail(supabase, email)

  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      email_confirm: true,
      password: demoPassword,
      user_metadata: { full_name: fullName },
    })

    if (error) {
      throw new Error(`auth update ${email}: ${error.message}`)
    }

    return data.user
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    password: demoPassword,
    user_metadata: { full_name: fullName },
  })

  if (error) {
    throw new Error(`auth create ${email}: ${error.message}`)
  }

  return data.user
}

async function ensureDemoAccess(serviceClient, ownerUser, employeeUser) {
  const period = getMonthBounds(normalizePeriodMonth(process.env.DEMO_PERIOD_MONTH ?? '2026-09-01'))
  const organizations = await query(
    'organizations',
    serviceClient.from('organizations').select('id,name').order('created_at', { ascending: true }).limit(1),
  )
  const organization = organizations[0]

  if (!organization) {
    throw new Error('No organization found. Run npm run demo:prepare first.')
  }

  await query(
    'owner profile',
    serviceClient.from('profiles').upsert(
      {
        email: ownerUser.email,
        full_name: 'Demo Owner',
        id: ownerUser.id,
        organization_id: organization.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    ),
  )

  const latestRuns = await query(
    'demo finalized payroll run',
    serviceClient
      .from('payroll_runs')
      .select('id')
      .eq('organization_id', organization.id)
      .eq('status', 'finalized')
      .eq('period_start', period.startDate)
      .eq('period_end', period.endDate)
      .limit(1),
  )
  const demoRun = latestRuns[0]

  if (!demoRun) {
    throw new Error(`No finalized payroll run found for ${period.startDate} to ${period.endDate}. Run npm run demo:prepare first.`)
  }

  const lines = await query(
    'payroll lines',
    serviceClient
      .from('payroll_run_lines')
      .select('id,employee_id')
      .eq('payroll_run_id', demoRun.id)
      .order('created_at', { ascending: true })
  )

  if (!lines.length) {
    throw new Error('No payroll line found for the latest finalized run.')
  }

  const payslips = await query(
    'published payslips',
    serviceClient
      .from('payslips')
      .select('payroll_run_line_id')
      .in(
        'payroll_run_line_id',
        lines.map((line) => line.id),
      )
      .not('published_at', 'is', null),
  )
  const payslipLineIds = new Set(payslips.map((payslip) => payslip.payroll_run_line_id))
  const line = lines.find((candidate) => payslipLineIds.has(candidate.id))

  if (!line) {
    throw new Error(`No published payslip found for ${period.startDate} to ${period.endDate}. Run npm run demo:prepare first.`)
  }

  const employees = await query(
    'employee for demo account',
    serviceClient
      .from('employees')
      .select('id,full_name')
      .eq('id', line.employee_id)
      .eq('organization_id', organization.id)
      .limit(1),
  )
  const employee = employees[0]

  if (!employee) {
    throw new Error('Could not find the employee attached to the latest payroll line.')
  }

  await query(
    'employee profile',
    serviceClient.from('profiles').upsert(
      {
        email: employeeUser.email,
        full_name: employee.full_name,
        id: employeeUser.id,
        organization_id: organization.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    ),
  )

  await query(
    'employee profile reassignment cleanup',
    serviceClient
      .from('employees')
      .update({ profile_id: null })
      .eq('organization_id', organization.id)
      .eq('profile_id', employeeUser.id)
      .neq('id', employee.id),
  )

  await query(
    'employee profile link',
    serviceClient.from('employees').update({ profile_id: employeeUser.id, work_email: employeeUser.email }).eq('id', employee.id),
  )

  const roleRows = [
    ...['owner', 'hr', 'finance'].map((role) => ({
      organization_id: organization.id,
      role,
      user_id: ownerUser.id,
    })),
    {
      organization_id: organization.id,
      role: 'employee',
      user_id: employeeUser.id,
    },
  ]

  await query('demo roles', serviceClient.from('user_roles').upsert(roleRows, { onConflict: 'organization_id,user_id,role' }))
}

async function signIn(publicClient, email) {
  const { data, error } = await publicClient.auth.signInWithPassword({
    email,
    password: demoPassword,
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

const ownerEmail = process.env.DEMO_OWNER_EMAIL ?? 'demo.owner@vetanflow.example.com'
const employeeEmail = process.env.DEMO_EMPLOYEE_EMAIL ?? 'aarav@example.com'
const ownerPayrollView = `
(() => {
  const headings = Array.from(document.querySelectorAll('h2, h3'));
  const target = headings.find((heading) => heading.textContent?.includes('Payroll runs'));
  target?.scrollIntoView({ block: 'start' });
  window.scrollBy(0, -88);
  const periodSelect = Array.from(document.querySelectorAll('select'))
    .find((select) => Array.from(select.options).some((option) => option.value === '2026-09'));
  if (periodSelect) {
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
    valueSetter?.call(periodSelect, '2026-09');
    periodSelect.dispatchEvent(new Event('change', { bubbles: true }));
    window.setTimeout(() => {
      const septemberRun = Array.from(document.querySelectorAll('button'))
        .find((button) => button.textContent?.includes('01 Sept 2026'));
      septemberRun?.click();
      target?.scrollIntoView({ block: 'start' });
      window.scrollBy(0, -88);
    }, 300);
  }
})()
`

const ownerUser = await ensureAuthUser(serviceClient, { email: ownerEmail, fullName: 'Demo Owner' })
const employeeUser = await ensureAuthUser(serviceClient, { email: employeeEmail, fullName: 'Demo Employee' })
await ensureDemoAccess(serviceClient, ownerUser, employeeUser)

const ownerSession = await signIn(publicClient, ownerEmail)
const employeeSession = await signIn(publicClient, employeeEmail)

for (const viewport of viewports) {
  await captureSession({
    browser,
    expectedText: 'Run history',
    postPrepareExpectedText: 'Aarav Mehta',
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
