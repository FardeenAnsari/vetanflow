import { readFileSync } from 'node:fs'

try {
  const { users } = JSON.parse(
    readFileSync(new URL('../.tmp/demo-credentials.json', import.meta.url), 'utf8'),
  )
  console.table(
    users.map(({ role, fullName, email, password }) => ({ role, name: fullName, email, password })),
  )
} catch {
  console.error('Demo credentials are not ready. Run npm run demo:bootstrap first.')
  process.exitCode = 1
}
