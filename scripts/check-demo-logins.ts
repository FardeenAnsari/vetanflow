import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'

type DemoCredential = {
  email: string
  fullName: string
  password: string
  role: 'owner' | 'admin' | 'hr' | 'finance' | 'manager' | 'employee'
}

const root = process.cwd()

function loadEnvFile(path: string) {
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

async function getJson(url: string, accessToken: string) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const body = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(`${url}: ${response.status} ${JSON.stringify(body)}`)
  }

  return body
}

loadEnvFile(join(root, 'backend/.env'))

const supabaseUrl = process.env.SUPABASE_URL
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY
const credentialsPath = join(root, '.tmp/demo-credentials.json')
const apiBaseUrl = process.env.DEMO_API_BASE_URL ?? 'http://localhost:4000'

if (!supabaseUrl || !publishableKey) {
  throw new Error('SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required in backend/.env.')
}

if (!existsSync(credentialsPath)) {
  throw new Error('Run npm run demo:seed-showcase before checking role logins.')
}

const credentials = (JSON.parse(readFileSync(credentialsPath, 'utf8')) as { users: DemoCredential[] }).users
const results: Array<{ employees: number; idCards: string; leaveRequests: number; payslips: number; payrollRuns: number; role: string }> = []
let ownerVisibleEmployeeIds: string[] = []

for (const credential of credentials) {
  const client = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: WebSocket },
  })
  const { data, error } = await client.auth.signInWithPassword({
    email: credential.email,
    password: credential.password,
  })

  if (error || !data.session) {
    throw new Error(`${credential.role} login failed: ${error?.message ?? 'missing session'}`)
  }

  const token = data.session.access_token
  const [masterData, leaveData, payrollData, payslipData] = await Promise.all([
    getJson(`${apiBaseUrl}/api/hr/master-data`, token),
    getJson(`${apiBaseUrl}/api/leave/dashboard`, token),
    getJson(`${apiBaseUrl}/api/payroll/runs`, token),
    getJson(`${apiBaseUrl}/api/payroll/payslips`, token),
  ])
  const returnedRoles = masterData.data.currentUserRoles as string[]
  const visibleEmployees = masterData.data.employees as Array<{ id: string }>

  if (returnedRoles.length !== 1 || returnedRoles[0] !== credential.role) {
    throw new Error(`${credential.role} returned unexpected roles: ${returnedRoles.join(', ')}`)
  }

  if (credential.role === 'owner') {
    ownerVisibleEmployeeIds = visibleEmployees.map((employee) => employee.id)
  }

  const ownCardEmployeeId = visibleEmployees[0]?.id
  let idCards = 'not applicable'

  if (ownCardEmployeeId) {
    const ownCardResponse = await fetch(`${apiBaseUrl}/api/hr/employees/${ownCardEmployeeId}/id-card`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!ownCardResponse.ok) {
      throw new Error(`${credential.role} could not download an authorized ID card: ${ownCardResponse.status}`)
    }

    idCards = 'authorized card 200'
  }

  if (credential.role === 'owner' && ownerVisibleEmployeeIds.length > 1) {
    const secondCardResponse = await fetch(
      `${apiBaseUrl}/api/hr/employees/${ownerVisibleEmployeeIds.at(-1)}/id-card`,
      { headers: { Authorization: `Bearer ${token}` } },
    )

    if (!secondCardResponse.ok) {
      throw new Error(`owner could not download a second employee ID card: ${secondCardResponse.status}`)
    }

    idCards = 'multiple employee cards 200'
  }

  if (credential.role === 'employee' && ownCardEmployeeId) {
    const crossEmployeeId = ownerVisibleEmployeeIds.find((employeeId) => employeeId !== ownCardEmployeeId)

    if (crossEmployeeId) {
      const crossCardResponse = await fetch(`${apiBaseUrl}/api/hr/employees/${crossEmployeeId}/id-card`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (crossCardResponse.status !== 404) {
        throw new Error(`employee cross-record ID card access returned ${crossCardResponse.status}, expected 404`)
      }

      idCards = 'own 200, cross-record 404'
    }
  }

  results.push({
    employees: masterData.data.employees.length,
    idCards,
    leaveRequests: leaveData.data.requests.length,
    payslips: payslipData.data.payslips.length,
    payrollRuns: payrollData.data.runs.length,
    role: credential.role,
  })

  await client.auth.signOut()
}

console.log('VetanFlow role login and visibility check')
for (const result of results) {
  console.log(
    `[PASS] ${result.role}: ${result.employees} visible employees, ${result.leaveRequests} leave requests, ${result.payrollRuns} payroll runs, ${result.payslips} payslips, ID cards ${result.idCards}`,
  )
}
console.log(`${results.length}/${credentials.length} role accounts passed`)
