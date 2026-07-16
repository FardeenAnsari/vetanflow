import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

const root = process.cwd()
const outputDir = resolve(root, process.env.DEMO_SCREENSHOT_DIR ?? 'docs/screenshots')
const appUrl = process.env.DEMO_APP_URL ?? 'http://127.0.0.1:5173/app'
const prefix = process.env.DEMO_SCREENSHOT_PREFIX ?? 'sign-in'
const suppliedUserDataDir = process.env.CHROME_USER_DATA_DIR ? resolve(root, process.env.CHROME_USER_DATA_DIR) : ''
const expectedText = process.env.DEMO_SCREENSHOT_EXPECT_TEXT ?? ''
const timeoutMs = Number(process.env.DEMO_SCREENSHOT_TIMEOUT_MS ?? 20_000)

const viewports = [
  { label: 'desktop', width: 1440, height: 1000 },
  { label: 'mobile', width: 500, height: 844 },
]

function findExecutable(command) {
  try {
    return execFileSync('which', [command], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return ''
  }
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

const browser = findBrowser()

if (!browser) {
  throw new Error('Chrome, Edge, or Chromium was not found. Set CHROME_PATH to the browser executable.')
}

if (suppliedUserDataDir && !existsSync(suppliedUserDataDir)) {
  throw new Error(`Chrome profile directory was not found: ${suppliedUserDataDir}`)
}

mkdirSync(outputDir, { recursive: true })

function runChrome(args) {
  const result = spawnSync(browser, args, { encoding: 'utf8', timeout: timeoutMs })

  if (result.status !== 0) {
    const message =
      result.error?.message || result.stderr || result.stdout || `Chrome exited with status ${result.status}`
    throw new Error(message.trim())
  }

  return result
}

for (const viewport of viewports) {
  const outputPath = join(outputDir, `${prefix}-${viewport.label}.png`)
  const userDataDir = suppliedUserDataDir || mkdtempSync(join(tmpdir(), `vetanflow-chrome-${viewport.label}-`))
  const baseArgs = [
    '--headless=new',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    `--window-size=${viewport.width},${viewport.height}`,
    '--virtual-time-budget=5000',
  ]

  if (expectedText) {
    const domResult = runChrome([...baseArgs, '--dump-dom', appUrl])

    if (!domResult.stdout.includes(expectedText)) {
      throw new Error(
        `Expected text "${expectedText}" was not found for ${viewport.label}. Check that ${userDataDir} is signed in for this screenshot.`,
      )
    }
  }

  runChrome([...baseArgs, `--screenshot=${outputPath}`, appUrl])

  if (!existsSync(outputPath)) {
    throw new Error(
      `Chrome reported success but did not write ${outputPath}. If you are using CHROME_USER_DATA_DIR, close that Chrome profile before capturing.`,
    )
  }

  console.log(`Captured ${outputPath}`)
}
