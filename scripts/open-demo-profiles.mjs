import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const appUrl = process.env.DEMO_APP_URL ?? 'http://127.0.0.1:5173/app'

const profiles = [
  { label: 'owner/admin', dir: '.tmp/chrome-owner' },
  { label: 'employee', dir: '.tmp/chrome-employee' },
]

function openProfile(profile) {
  const userDataDir = resolve(root, profile.dir)
  mkdirSync(userDataDir, { recursive: true })

  const result =
    process.platform === 'darwin'
      ? spawnSync(
          'open',
          ['-na', process.env.CHROME_APP_NAME ?? 'Google Chrome', '--args', `--user-data-dir=${userDataDir}`, '--new-window', appUrl],
          { stdio: 'inherit' },
        )
      : spawnSync(
          process.env.CHROME_PATH ?? 'google-chrome',
          [`--user-data-dir=${userDataDir}`, '--new-window', appUrl],
          { stdio: 'inherit' },
        )

  if (result.status !== 0) {
    const commandHint = process.platform === 'darwin' ? 'CHROME_APP_NAME' : 'CHROME_PATH'
    throw new Error(`Could not open the ${profile.label} Chrome profile. Set ${commandHint} and try again.`)
  }

  console.log(`Opened ${profile.label} profile at ${profile.dir}`)
}

for (const profile of profiles) {
  openProfile(profile)
}

console.log('')
console.log('Sign in once in each Chrome window, then close both windows before running authenticated captures.')
