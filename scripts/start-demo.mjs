import { spawn } from 'node:child_process'

const child = spawn(process.execPath, [process.env.npm_execpath, 'run', 'dev'], {
  env: { ...process.env, DEMO_ACCESS_ENABLED: 'true' },
  stdio: 'inherit',
})
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal))
}
child.on('exit', (code) => process.exit(code ?? 1))
child.on('error', (error) => {
  console.error(error.message)
  process.exitCode = 1
})
