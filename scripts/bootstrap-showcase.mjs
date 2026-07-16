import { spawnSync } from 'node:child_process'

function monthOffset(offset) {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1)).toISOString().slice(0, 10)
}

function run(script, extraEnv = {}) {
  const npmCli = process.env.npm_execpath
  const command = npmCli ? process.execPath : process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const args = npmCli ? [npmCli, 'run', script] : ['run', script]
  const result = spawnSync(command, args, {
    env: { ...process.env, ...extraEnv },
    stdio: 'inherit',
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

run('demo:seed-showcase')
for (const offset of [-6, -5, -4, -3, -2, -1]) {
  run('demo:prepare', { DEMO_PERIOD_MONTH: monthOffset(offset) })
}
run('demo:check')
run('demo:check-logins')

console.log('VetanFlow showcase bootstrap complete.')
