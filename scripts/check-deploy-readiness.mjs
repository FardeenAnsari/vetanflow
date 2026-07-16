import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'

const root = process.cwd()
const checks = []

function read(path) {
  return readFileSync(join(root, path), 'utf8')
}

function hasFile(path) {
  checks.push({
    detail: path,
    ok: existsSync(join(root, path)),
    title: 'Required file',
  })
}

function hasScript(packageJson, script) {
  checks.push({
    detail: script,
    ok: Boolean(packageJson.scripts?.[script]),
    title: 'Package script',
  })
}

function envHas(path, key) {
  const content = read(path)

  checks.push({
    detail: `${path} -> ${key}`,
    ok: new RegExp(`^${key}=`, 'm').test(content),
    title: 'Env example key',
  })
}

function command(commandText) {
  try {
    return execSync(commandText, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return ''
  }
}

const rootPackage = JSON.parse(read('package.json'))

for (const file of [
  '.github/workflows/ci.yml',
  '.nvmrc',
  'backend/.env.example',
  'frontend/.env.example',
  'docs/DEPLOYMENT.md',
  'render.yaml',
  'vercel.json',
]) {
  hasFile(file)
}

for (const script of ['build', 'verify', 'demo:check', 'demo:reset', 'screenshots:capture-authenticated']) {
  hasScript(rootPackage, script)
}

for (const key of ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'CORS_ORIGIN']) {
  envHas('backend/.env.example', key)
}

for (const key of ['VITE_API_BASE_URL', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY']) {
  envHas('frontend/.env.example', key)
}

checks.push({
  detail: 'frontend/.env.example must not mention service role keys',
  ok: !/SERVICE_ROLE|SECRET_KEY/.test(read('frontend/.env.example')),
  title: 'Frontend secret boundary',
})

checks.push({
  detail: `engines.node = ${rootPackage.engines?.node ?? 'missing'}`,
  ok: /^>=2[2-9]/.test(rootPackage.engines?.node ?? ''),
  title: 'Node engine',
})

const remote = command('git remote -v')
const failures = checks.filter((check) => !check.ok)

console.log('VetanFlow deployment readiness')

for (const check of checks) {
  console.log(`${check.ok ? '[PASS]' : '[FAIL]'} ${check.title}: ${check.detail}`)
}

if (!remote) {
  console.log('[WARN] Git remote: no remote configured yet. Add one before connecting Vercel/Render.')
}

if (failures.length) {
  process.exitCode = 1
}
