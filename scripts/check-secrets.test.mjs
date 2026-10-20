import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const checker = fileURLToPath(new URL('./check-secrets.mjs', import.meta.url))

function fixture(check) {
  const cwd = mkdtempSync(join(tmpdir(), 'vetanflow-secret-check-'))
  try {
    execFileSync('git', ['init', '--quiet'], { cwd })
    return check(cwd, (...args) => spawnSync(process.execPath, [checker, ...args], { cwd, encoding: 'utf8' }))
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
}

test('accepts placeholder configuration', () => fixture((cwd, run) => {
  writeFileSync(join(cwd, '.env.example'), 'SUPABASE_SERVICE_ROLE_KEY=replace-me\n')
  assert.equal(run().status, 0)
}))

test('rejects a local credential without printing its value', () => fixture((cwd, run) => {
  const secret = 'synthetic-credential-for-scanner-test'
  mkdirSync(join(cwd, 'backend'))
  writeFileSync(join(cwd, '.gitignore'), 'backend/.env\n')
  writeFileSync(join(cwd, 'backend/.env'), `SUPABASE_SERVICE_ROLE_KEY=${secret}\n`)
  writeFileSync(join(cwd, 'leak.txt'), secret)
  const result = run()
  assert.equal(result.status, 1)
  assert.match(result.stderr, /leak.txt: contains a local credential/)
  assert.ok(!`${result.stdout}${result.stderr}`.includes(secret))
}))

test('rejects service-role tokens without local configuration', () => fixture((cwd, run) => {
  const payload = Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')
  writeFileSync(join(cwd, 'leak.txt'), `eyJhbGciOiJIUzI1NiJ9.${payload}.synthetic_signature`)
  assert.equal(run().status, 1)
}))

test('finds a private key removed from the current tree but retained in history', () => fixture((cwd, run) => {
  writeFileSync(join(cwd, 'old-key.txt'), `${['-----BEGIN', 'PRIVATE KEY-----'].join(' ')}\nsynthetic\n`)
  execFileSync('git', ['add', '.'], { cwd })
  execFileSync('git', ['-c', 'user.name=Scanner Test', '-c', 'user.email=scanner@example.com', '-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'test fixture'], { cwd })
  rmSync(join(cwd, 'old-key.txt'))
  const result = run('--history')
  assert.equal(result.status, 1)
  assert.match(result.stderr, /reachable Git history: contains a private key/)
}))
