import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

if (!process.argv.includes('--write-sample')) throw new Error('Use --write-sample to authorize temporary sample records and cleanup.')
process.loadEnvFile('backend/.env')
const { getSupabaseServiceClient } = await import('../backend/src/lib/supabase.js')
const { linkInvitedEmployee } = await import('../backend/src/modules/auth/employee-account-link.js')
const db = getSupabaseServiceClient()!
assert(process.env.SUPABASE_URL?.includes('indlpqjabkkdwsrxeokq'), 'This check is restricted to the VetanFlow sample project')
const organizationId = '00000000-0000-0000-0000-000000000001'
const org = await db.from('organizations').select('*').eq('id', organizationId).single()
assert.ifError(org.error)
assert.equal(org.data.name, 'VetanFlow Labs')
assert.equal(org.data.currency_code, 'INR')
const credentials = JSON.parse(readFileSync('.tmp/demo-credentials.json', 'utf8')).users
const owner = credentials.find((user: { role: string }) => user.role === 'owner')
const ownerClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } })
const login = await ownerClient.auth.signInWithPassword({ email: owner.email, password: owner.password })
assert.ifError(login.error)
const base = process.env.DEMO_API_BASE_URL ?? 'http://localhost:4000'
const userIds: string[] = []
const employeeIds: string[] = []
const checks: string[] = []
const nonce = randomBytes(5).toString('hex')

async function api(path: string, body?: unknown, token = login.data.session!.access_token, method = 'POST') {
  const response = await fetch(`${base}/api${path}`, {
    method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(20000),
  })
  return { status: response.status, body: await response.json() }
}

async function createAccount(email: string) {
  const password = `Vf@${randomBytes(20).toString('base64url')}`
  const auth = await db.auth.admin.createUser({ email, password, email_confirm: true })
  assert.ifError(auth.error)
  const id = auth.data.user!.id
  userIds.push(id)
  const profile = await db.from('profiles').upsert({ id, email, full_name: 'Aarav Sharma', organization_id: organizationId })
  assert.ifError(profile.error)
  const role = await db.from('user_roles').insert({ user_id: id, role: 'employee', organization_id: organizationId })
  assert.ifError(role.error)
  const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } })
  const session = await client.auth.signInWithPassword({ email, password })
  assert.ifError(session.error)
  return { id, client, token: session.data.session!.access_token }
}

async function createEmployee(email: string, suffix: string) {
  const response = await api('/hr/employees', {
    organizationId, code: `CHECK-${nonce}-${suffix}`, fullName: 'Aarav Sharma', role: 'Software Engineer',
    annualCompensation: 1200000, joiningDate: new Date().toISOString().slice(0, 10),
    departmentId: '10000000-0000-0000-0000-000000000001', workLocationId: '20000000-0000-0000-0000-000000000003',
    workEmail: email, status: 'draft',
  })
  assert.equal(response.status, 201, JSON.stringify(response.body))
  employeeIds.push(response.body.data.id)
  return response.body.data.id as string
}

try {
  for (const order of ['account-first', 'employee-first']) {
    const email = `onboarding-${nonce}-${order}@vetanflow.example.com`
    let account: Awaited<ReturnType<typeof createAccount>>
    let employeeId: string
    if (order === 'account-first') {
      account = await createAccount(email)
      employeeId = await createEmployee(` ${email.toUpperCase()} `, order)
    } else {
      employeeId = await createEmployee(email, order)
      account = await createAccount(email)
      await linkInvitedEmployee(db, organizationId, email, account.id)
    }
    const master = await api('/hr/master-data', undefined, account.token, 'GET')
    assert.equal(master.status, 200)
    assert.equal(master.body.data.currentEmployeeId, employeeId)
    assert.deepEqual(master.body.data.currentUserRoles, ['employee'])
    assert.equal(master.body.data.employees.length, 1)
    checks.push(`${order}: real Auth, linked employee, self-only workspace`)

    const duplicate = await api('/hr/employees', {
      organizationId, code: `CHECK-${nonce}-duplicate`, fullName: 'Aarav Sharma', role: 'Engineer', annualCompensation: 1200000,
      joiningDate: '2026-10-01', departmentId: '10000000-0000-0000-0000-000000000001',
      workLocationId: '20000000-0000-0000-0000-000000000003', workEmail: email, status: 'draft',
    })
    assert.equal(duplicate.status, 409, JSON.stringify(duplicate.body))
    await account.client.auth.signOut({ scope: 'local' })
  }
  checks.push('Duplicate work emails rejected with HTTP 409')
  const currency = await api('/hr/organization', {
    organizationId, name: org.data.name, countryCode: 'IN', currencyCode: 'USD', locale: 'en-IN', timezone: 'Asia/Kolkata',
  }, login.data.session!.access_token, 'PATCH')
  assert.equal(currency.status, 409, JSON.stringify(currency.body))
  checks.push('Historical payroll currency protected with HTTP 409')
  console.log(checks.join('\n'))
} finally {
  for (const employeeId of employeeIds) {
    const employee = await db.from('employees').delete().eq('organization_id', organizationId).eq('id', employeeId)
    assert.ifError(employee.error)
    const audit = await db.from('audit_logs').delete().eq('organization_id', organizationId).eq('entity_id', employeeId)
    assert.ifError(audit.error)
  }
  for (const id of userIds) {
    const removed = await db.auth.admin.deleteUser(id)
    assert.ifError(removed.error)
  }
  await ownerClient.auth.signOut({ scope: 'local' })
  console.log('Temporary onboarding records and accounts removed.')
}
