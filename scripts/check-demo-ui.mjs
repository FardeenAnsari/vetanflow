import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import WebSocket from 'ws'

const appUrl = process.env.DEMO_APP_URL ?? 'http://localhost:5173'
const apiUrl = process.env.DEMO_API_BASE_URL ?? 'http://localhost:4000'
const browserPath = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const output = join(process.cwd(), '.tmp/demo-ui-proof')
if (!existsSync(browserPath))
  throw new Error('Set CHROME_PATH to an installed Chrome or Chromium executable.')
mkdirSync(output, { recursive: true })
const downloadPath = mkdtempSync(join(output, 'downloads-'))
const port = await new Promise((resolve, reject) => {
  const server = createServer()
  server.once('error', reject)
  server.listen(0, '127.0.0.1', () => {
    const { port } = server.address()
    server.close(() => resolve(port))
  })
})
const browser = spawn(
  browserPath,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-allow-origins=*',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${mkdtempSync(join(tmpdir(), 'vetanflow-ui-'))}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
)
const delay = (duration) => new Promise((resolve) => setTimeout(resolve, duration))
let socket
let nextId = 0
const pending = new Map()
const exceptions = []
const failures = []
const checks = []
function send(method, params = {}) {
  const id = ++nextId
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id)
      reject(new Error(`${method} timed out`))
    }, 25_000)
    pending.set(id, {
      resolve: (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      reject: (error) => {
        clearTimeout(timer)
        reject(error)
      },
    })
    socket.send(JSON.stringify({ id, method, params }))
  })
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
  return result.result?.value
}
async function wait(expression, label) {
  const start = Date.now()
  while (Date.now() - start < 30_000) {
    try {
      if (await evaluate(expression)) return
    } catch (error) {
      if (!/navigated|context|Cannot find/.test(error.message)) throw error
    }
    await delay(150)
  }
  throw new Error(
    `Timed out: ${label}. Visible page: ${(await evaluate('document.body.innerText')).slice(0, 700)}`,
  )
}
async function clickText(text, selector = 'button') {
  await evaluate(
    `(() => { const target = [...document.querySelectorAll(${JSON.stringify(selector)})].find((item) => item.textContent.includes(${JSON.stringify(text)}) && item.getClientRects().length); if (!target) throw new Error('Control not found'); target.click() })()`,
  )
}
async function capture(name, width = 1440, height = 1000) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600,
  })
  await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
  const geometry = await evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth})')
  assert.ok(geometry.scroll <= geometry.width, `${name}: horizontal overflow ${JSON.stringify(geometry)}`)
  const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  writeFileSync(join(output, `${name}.png`), Buffer.from(result.data, 'base64'))
}
async function navigate(path) {
  await send('Page.navigate', { url: `${appUrl}${path}` })
}

try {
  let target
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
      target = targets.find((item) => item.type === 'page')
      if (target) break
    } catch {
      /* Chrome is starting. */
    }
    await delay(100)
  }
  if (!target) throw new Error('Chrome did not start')
  socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.once('open', resolve)
    socket.once('error', reject)
  })
  socket.on('message', (message) => {
    const data = JSON.parse(String(message))
    if (data.id) {
      const job = pending.get(data.id)
      pending.delete(data.id)
      if (data.error) job?.reject(new Error(data.error.message))
      else job?.resolve(data.result)
    } else if (data.method === 'Runtime.exceptionThrown') exceptions.push(data.params.exceptionDetails.text)
    else if (data.method === 'Network.responseReceived' && data.params.response.status >= 500)
      failures.push(data.params.response.url)
  })
  await send('Page.enable')
  await send('Runtime.enable')
  await send('Network.enable')
  await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath })
  const response = await fetch(`${apiUrl}/api/demo/accounts`)
  assert.equal(response.status, 200, 'Start npm run demo before checking the UI')
  const { data: accounts } = await response.json()
  const expected = {
    owner: 'Owner workspace',
    admin: 'Administration',
    hr: 'People operations',
    finance: 'Finance operations',
    manager: 'Manager workspace',
    employee: 'My payroll workspace',
  }
  for (const role of ['owner', 'hr', 'finance', 'manager', 'employee', 'admin']) {
    const account = accounts.find((item) => item.role === role)
    assert.ok(account, `No ${role} demo account`)
    await navigate('/demo')
    await wait(
      `location.pathname === '/demo' && document.querySelector('h1')?.textContent === 'Choose a workspace' && document.body.innerText.includes(${JSON.stringify(account.email)})`,
      'account picker',
    )
    if (role === 'owner') await capture('demo-picker')
    await clickText(account.email)
    await wait(
      `location.pathname === '/app' && document.querySelector('h1')?.textContent === ${JSON.stringify(expected[role])}`,
      `${role} workspace`,
    )
    await wait(
      `document.body.innerText.includes(${JSON.stringify(account.fullName)}) || document.body.innerText.includes(${JSON.stringify(account.email)})`,
      `${role} identity`,
    )
    await capture(`${role}-desktop`)
    const nav = await evaluate(
      '[...document.querySelectorAll("nav a")].filter(a=>a.getClientRects().length).map(a=>a.textContent.trim())',
    )
    if (role === 'manager')
      assert.ok(
        !nav.includes('Payroll') && !nav.includes('Access & roles'),
        'Manager received administrative navigation',
      )
    if (role === 'finance')
      assert.ok(
        !nav.includes('Access & roles') && !nav.includes('Organization'),
        'Finance received access management',
      )
    if (role === 'employee') {
      assert.ok(
        !nav.includes('People') && !nav.includes('Payroll'),
        'Employee received operations navigation',
      )
      await capture('employee-mobile', 375, 812)
      await capture('employee-desktop')
      await clickText('Pay history', 'a')
      await wait('document.querySelector("h1")?.textContent === "My pay history"', 'employee pay history')
      assert.ok(
        await evaluate(
          '[...document.querySelectorAll("button")].some(b=>b.getClientRects().length && b.textContent.trim()==="Download")',
        ),
        'Employee has no downloadable payslip',
      )
      await capture('employee-pay')
      await clickText('Download', '#employee-pay button')
      await wait('document.body.innerText.includes("Payslip downloaded")', 'payslip download')
      assert.equal(
        await evaluate('location.pathname'),
        '/app',
        'Payslip download navigated away from the workspace',
      )
      await clickText('Leave requests', 'a')
      await wait('document.querySelector("h1")?.textContent === "My leave requests"', 'employee leave')
      await capture('employee-leave-mobile', 375, 812)
      await capture('employee-leave')
    }
    if (role === 'owner') {
      await capture('owner-mobile', 375, 812)
      await capture('owner-desktop')
      await clickText('People', 'nav a')
      await wait('document.querySelector("h1")?.textContent === "People directory"', 'people directory')
      await capture('people-directory')
      await clickText('ID PDF', 'section[aria-label="People directory"] button')
      await wait('document.body.innerText.includes("Employee ID card PDF downloaded")', 'ID PDF download')
      await wait('!document.querySelector(\'[role="status"].fixed\')', 'ID card animation finished')
      await clickText('Payroll', 'nav a')
      await wait(
        '[...document.querySelectorAll("h3")].some(h=>h.textContent === "Run lines")',
        'payroll page',
      )
      await wait(
        '[...document.querySelectorAll("tbody tr")].some(row => row.getClientRects().length && row.textContent.includes("VF-006"))',
        'auto-loaded payroll detail',
      )
      await capture('payroll-detail')
      await clickText('Bank CSV')
      await wait('document.body.innerText.includes("Bank export downloaded")', 'bank export download')
    }
    if (role !== 'employee') {
      await clickText('My profile & pay', 'nav a')
      await wait(
        'document.querySelector("h1")?.textContent === "My payroll workspace"',
        `${role} personal workspace`,
      )
      await wait(
        `document.body.innerText.includes(${JSON.stringify(account.fullName)})`,
        `${role} own employee record`,
      )
      const personalHeading = await evaluate('document.querySelector("h1")?.nextElementSibling?.textContent')
      assert.ok(
        personalHeading.includes(account.fullName),
        `${role} personal page shows a different employee`,
      )
      await clickText('Back to operations')
      await wait(
        `document.querySelector('h1')?.textContent === ${JSON.stringify(expected[role])}`,
        `${role} return to operations`,
      )
    }
    checks.push({ role, email: account.email, status: 'pass' })
    console.log(`[PASS] ${role}: correct workspace, identity, navigation, and responsive layout`)
  }
  await navigate('/login')
  await wait('document.body.innerText.includes("Choose how to continue")', 'active account choice')
  await clickText('Use another account')
  await wait('!!document.querySelector("input[type=email]")', 'signed-out login form')
  const employeeCredential = JSON.parse(
    readFileSync(join(process.cwd(), '.tmp/demo-credentials.json'), 'utf8'),
  ).users.find((account) => account.role === 'employee')
  assert.ok(employeeCredential, 'Employee credentials are required for the manual login check')
  await navigate('/login?demoRole=employee')
  await wait(
    `document.querySelector('input[type=email]')?.value === ${JSON.stringify(employeeCredential.email)}`,
    'prefilled employee login',
  )
  await evaluate(`(() => {
    const input = document.querySelector('input[type=password]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(employeeCredential.password)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('form').requestSubmit();
  })()`)
  await wait(
    'location.pathname === "/app" && document.querySelector("h1")?.textContent === "My payroll workspace"',
    'manual employee password sign-in',
  )
  assert.ok(
    (await evaluate('document.body.innerText')).includes(employeeCredential.fullName),
    'Manual password login opened the wrong employee workspace',
  )
  assert.deepEqual(exceptions, [], 'Browser runtime exceptions')
  assert.deepEqual(failures, [], 'Server failures during demo')
  const downloads = readdirSync(downloadPath)
  assert.ok(
    downloads.filter((name) => name.endsWith('.pdf')).length >= 2,
    'Expected ID card and payslip PDFs',
  )
  assert.ok(
    downloads.some((name) => name.endsWith('.csv')),
    'Expected bank CSV export',
  )
  for (const name of downloads.filter((name) => name.endsWith('.pdf'))) {
    assert.equal(
      readFileSync(join(downloadPath, name)).subarray(0, 4).toString(),
      '%PDF',
      'Downloaded document is not a PDF',
    )
  }
  writeFileSync(
    join(output, 'results.json'),
    JSON.stringify({ checkedAt: new Date().toISOString(), checks, exceptions, failures, downloads }, null, 2),
  )
  console.log(`Browser proof: ${output}`)
} finally {
  socket?.close()
  browser.kill('SIGTERM')
}
