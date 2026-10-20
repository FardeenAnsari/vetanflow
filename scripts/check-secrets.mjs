import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'

const git = (...args) => execFileSync('git', args, {
  encoding: 'utf8',
  maxBuffer: 100 * 1024 * 1024,
})
const knownSecrets = new Set()
const findings = new Set()

for (const path of ['backend/.env', 'frontend/.env']) {
  if (!existsSync(path)) continue
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (!match || !/SERVICE_ROLE|SECRET_KEY|PASSWORD|TOKEN/.test(match[1])) continue
    const value = match[2].trim().replace(/^["']|["']$/g, '')
    if (value.length > 10) knownSecrets.add(value)
  }
}
if (existsSync('.tmp/demo-credentials.json')) {
  for (const user of JSON.parse(readFileSync('.tmp/demo-credentials.json', 'utf8')).users) {
    if (user.password) knownSecrets.add(user.password)
  }
}

function inspect(content, location) {
  if ([...knownSecrets].some((secret) => content.includes(secret))) {
    findings.add(`${location}: contains a local credential`)
  }
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(content)) {
    findings.add(`${location}: contains a private key`)
  }
  if (/\bsb_secret_[A-Za-z0-9_-]{20,}\b/.test(content)
    || /\b(?:ghp_|github_pat_)[A-Za-z0-9_]{30,}\b/.test(content)) {
    findings.add(`${location}: contains a secret API token`)
  }
  for (const match of content.matchAll(/eyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g)) {
    try {
      if (JSON.parse(Buffer.from(match[1], 'base64url').toString()).role === 'service_role') {
        findings.add(`${location}: contains a service-role JWT`)
      }
    } catch { /* Ignore non-JWT text that happens to match the token shape. */ }
  }
}

const files = git('ls-files', '--cached', '--others', '--exclude-standard', '-z').split('\0').filter(Boolean)
for (const path of files) {
  if (!existsSync(path)) continue
  if (/(^|\/)\.env(?:\..+)?$/.test(path) && !path.endsWith('.env.example')) {
    findings.add(`${path}: environment file must not be committed`)
  }
  if (/(^|\/)(?:demo-credentials\.json|id_rsa|id_ed25519)$/.test(path)) {
    findings.add(`${path}: credential file must not be committed`)
  }
  const content = readFileSync(path)
  if (!content.includes(0)) inspect(content.toString('utf8'), path)
}

if (existsSync('frontend/dist')) {
  for (const path of readdirSync('frontend/dist', { recursive: true })) {
    if (/\.(?:js|html|json|map)$/.test(path)) {
      inspect(readFileSync(`frontend/dist/${path}`, 'utf8'), `frontend/dist/${path}`)
    }
  }
}

if (process.argv.includes('--history')) {
  inspect(git('log', '--all', '-p', '--format=', '--no-ext-diff'), 'reachable Git history')
}

for (const finding of findings) console.error(`[FAIL] ${finding}`)
console.log(`Secret check: ${files.length} push candidates checked; ${findings.size} findings.`)
console.log('Checks known local credentials and common secret formats; not a substitute for independent scanning.')
if (findings.size) process.exitCode = 1
