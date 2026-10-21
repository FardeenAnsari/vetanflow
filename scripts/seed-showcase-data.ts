import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

type DemoRole = 'owner' | 'admin' | 'hr' | 'finance' | 'manager' | 'employee'

type DemoCredential = {
  email: string
  employeeCode?: string
  fullName: string
  key: string
  password: string
  role: DemoRole
}

type StoredCredentials = {
  generatedAt: string
  users: DemoCredential[]
}

const root = process.cwd()
const credentialPath = join(root, '.tmp/demo-credentials.json')
const organizationId = '00000000-0000-0000-0000-000000000001'

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

async function query<T>(label: string, request: PromiseLike<{ data: T; error: { message?: string } | null }>) {
  const { data, error } = await request

  if (error) {
    throw new Error(`${label}: ${error.message ?? JSON.stringify(error)}`)
  }

  return data
}

function makePassword(role: DemoRole) {
  const label = role[0].toUpperCase() + role.slice(1)
  return `Vf@${label}_${randomBytes(7).toString('base64url')}!`
}

async function readOwnerPassword() {
  if (process.env.DEMO_OWNER_PASSWORD) {
    return process.env.DEMO_OWNER_PASSWORD
  }

  if (existsSync(credentialPath)) {
    const stored = JSON.parse(readFileSync(credentialPath, 'utf8')) as StoredCredentials
    const owner = stored.users.find((user) => user.role === 'owner')

    if (owner?.password) {
      return owner.password
    }
  }

  process.stdout.write('Enter the demo owner password, then press Enter: ')

  if (process.stdin.isTTY) {
    process.stdin.setRawMode?.(true)
    process.stdin.resume()

    return await new Promise<string>((resolve) => {
      let value = ''

      const handleInput = (chunk: Buffer) => {
        const text = chunk.toString('utf8')
        const newlineIndex = text.search(/[\r\n]/)

        if (newlineIndex >= 0) {
          value += text.slice(0, newlineIndex)
          process.stdin.off('data', handleInput)
          process.stdin.setRawMode?.(false)
          process.stdin.pause()
          process.stdout.write('\n')
          resolve(value.trim())
          return
        }

        if (text === '\u0003') {
          process.stdin.setRawMode?.(false)
          process.exit(130)
        }

        if (text === '\u007f') {
          value = value.slice(0, -1)
          return
        }

        value += text
      }

      process.stdin.on('data', handleInput)
    })
  }

  let input = ''

  for await (const chunk of process.stdin) {
    input += String(chunk)

    if (input.includes('\n')) {
      break
    }
  }

  return input.trim()
}

function getCredentials(ownerPassword: string): StoredCredentials {
  const existing = existsSync(credentialPath)
    ? (JSON.parse(readFileSync(credentialPath, 'utf8')) as StoredCredentials)
    : null
  const passwordByRole = new Map(existing?.users.map((user) => [user.role, user.password]) ?? [])
  const definitions: Array<Omit<DemoCredential, 'password'>> = [
    {
      email: 'developer.fardeenansari@gmail.com',
      employeeCode: 'VF-001',
      fullName: 'Fardeen Ansari',
      key: 'owner_primary',
      role: 'owner',
    },
    {
      email: 'admin.demo@vetanflow.example.com',
      employeeCode: 'VF-002',
      fullName: 'Meera Sharma',
      key: 'admin_primary',
      role: 'admin',
    },
    { email: 'admin.operations@vetanflow.example.com', employeeCode: 'VF-011', fullName: 'Aditya Nair', key: 'admin_operations', role: 'admin' },
    {
      email: 'hr.demo@vetanflow.example.com',
      employeeCode: 'VF-003',
      fullName: 'Ananya Iyer',
      key: 'hr_primary',
      role: 'hr',
    },
    { email: 'hr.partner@vetanflow.example.com', employeeCode: 'VF-010', fullName: 'Kavya Joshi', key: 'hr_partner', role: 'hr' },
    {
      email: 'finance.demo@vetanflow.example.com',
      employeeCode: 'VF-004',
      fullName: 'Rohan Verma',
      key: 'finance_primary',
      role: 'finance',
    },
    { email: 'finance.analyst@vetanflow.example.com', employeeCode: 'VF-009', fullName: 'Priya Shah', key: 'finance_analyst', role: 'finance' },
    {
      email: 'manager.demo@vetanflow.example.com',
      employeeCode: 'VF-005',
      fullName: 'Sneha Rao',
      key: 'manager_primary',
      role: 'manager',
    },
    { email: 'manager.success@vetanflow.example.com', employeeCode: 'VF-012', fullName: 'Vikram Desai', key: 'manager_success', role: 'manager' },
    {
      email: 'employee.demo@vetanflow.example.com',
      employeeCode: 'VF-006',
      fullName: 'Aarav Mehta',
      key: 'employee_primary',
      role: 'employee',
    },
    { email: 'amina.yusuf@vetanflow.example.com', employeeCode: 'VF-007', fullName: 'Amina Yusuf', key: 'employee_customer', role: 'employee' },
    { email: 'arjun.patel@vetanflow.example.com', employeeCode: 'VF-008', fullName: 'Arjun Patel', key: 'employee_quality', role: 'employee' },
  ]

  return {
    generatedAt: new Date().toISOString(),
    users: definitions.map((user) => ({
      ...user,
      password: user.role === 'owner' ? ownerPassword : (passwordByRole.get(user.role) ?? makePassword(user.role)),
    })),
  }
}

async function findAuthUserByEmail(supabase: any, email: string) {
  for (let page = 1; page <= 20; page += 1) {
    const data = await query(
      `list auth users page ${page}`,
      supabase.auth.admin.listUsers({ page, perPage: 100 }),
    )
    const user = data.users.find((candidate: { email?: string }) => candidate.email?.toLowerCase() === email.toLowerCase())

    if (user || data.users.length < 100) {
      return user ?? null
    }
  }

  return null
}

async function ensureAuthUser(supabase: any, credential: DemoCredential) {
  const previous = existsSync(credentialPath)
    ? (JSON.parse(readFileSync(credentialPath, 'utf8')) as StoredCredentials).users.find((user) => user.key === credential.key)
    : null
  const existing = await findAuthUserByEmail(supabase, credential.email)
    ?? (previous && previous.email !== credential.email ? await findAuthUserByEmail(supabase, previous.email) : null)
  const payload = {
    email: credential.email,
    email_confirm: true,
    password: credential.password,
    user_metadata: {
      demo_role: credential.role,
      full_name: credential.fullName,
      is_demo_user: true,
    },
  }

  if (existing) {
    const data = await query(
      `update ${credential.role} auth user`,
      supabase.auth.admin.updateUserById(existing.id, payload),
    )
    return data.user
  }

  const data = await query(`create ${credential.role} auth user`, supabase.auth.admin.createUser(payload))
  return data.user
}

function monthStart(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1))
}

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10)
}

function addDays(value: Date, amount: number) {
  const next = new Date(value)
  next.setUTCDate(next.getUTCDate() + amount)
  return next
}

function getCurrentWorkDates() {
  const today = new Date()
  const start = monthStart(today)
  const end = new Date(Math.max(start.getTime(), addDays(today, -1).getTime()))
  const dates: string[] = []

  for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, 1)) {
    const day = cursor.getUTCDay()

    if (day !== 0 && day !== 6) {
      dates.push(dateOnly(cursor))
    }
  }

  return dates.length ? dates : [dateOnly(start)]
}

function getLeaveDates(offset: number, days = 1) {
  const start = addDays(new Date(), offset)
  return {
    endDate: dateOnly(addDays(start, days - 1)),
    startDate: dateOnly(start),
  }
}

loadEnvFile(join(root, 'backend/.env'))

const ownerPassword = await readOwnerPassword()

if (ownerPassword.length < 12) {
  throw new Error('The owner password must contain at least 12 characters.')
}

const credentials = getCredentials(ownerPassword)
const { getSupabaseServiceClient } = await import('../backend/src/lib/supabase.js')
const supabase = getSupabaseServiceClient() as any

if (!supabase) {
  throw new Error('Supabase service client is not configured. Check backend/.env.')
}

const existingShowcaseOrganization = await query(
  'existing showcase organization safety check',
  supabase.from('organizations').select('id,name,currency_code').eq('id', organizationId).maybeSingle(),
)

if (existingShowcaseOrganization && existingShowcaseOrganization.name !== 'VetanFlow Labs') {
  throw new Error(`Refusing to reset organization ${organizationId}: expected VetanFlow Labs.`)
}
if (existingShowcaseOrganization && existingShowcaseOrganization.currency_code !== 'INR') {
  const runs = await query('currency safety check', supabase.from('payroll_runs').select('id').eq('organization_id', organizationId).limit(1))
  if (runs.length) throw new Error('Refusing to relabel historical payroll in another currency. Migrate its amounts explicitly first.')
}

await query(
  'showcase organization',
  supabase.from('organizations').upsert(
    {
      country_code: 'IN',
      currency_code: 'INR',
      id: organizationId,
      legal_name: 'VetanFlow Labs Private Limited',
      locale: 'en-IN',
      name: 'VetanFlow Labs',
      timezone: 'Asia/Kolkata',
    },
    { onConflict: 'id' },
  ),
)

const authUsers = new Map<DemoRole, any>()
const authUsersByKey = new Map<string, any>()

for (const credential of credentials.users) {
  const authUser = await ensureAuthUser(supabase, credential)
  authUsersByKey.set(credential.key, authUser)

  if (!authUsers.has(credential.role)) {
    authUsers.set(credential.role, authUser)
  }
}

await query(
  'showcase profiles',
  supabase.from('profiles').upsert(
    credentials.users.map((credential) => ({
      email: credential.email,
      full_name: credential.fullName,
      id: authUsersByKey.get(credential.key).id,
      organization_id: organizationId,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: 'id' },
  ),
)

for (const credential of credentials.users) {
  await query(
    'normalize managed demo role',
    supabase.from('user_roles').delete().eq('organization_id', organizationId)
      .eq('user_id', authUsersByKey.get(credential.key).id).neq('role', credential.role),
  )
}
await query(
  'showcase role assignments',
  supabase.from('user_roles').upsert(
    credentials.users.map((credential) => ({
      organization_id: organizationId,
      role: credential.role,
      user_id: authUsersByKey.get(credential.key).id,
    })),
    { onConflict: 'organization_id,user_id,role' },
  ),
)

const departments = [
  { id: '10000000-0000-0000-0000-000000000001', name: 'Engineering' },
  { id: '10000000-0000-0000-0000-000000000002', name: 'Finance' },
  { id: '10000000-0000-0000-0000-000000000003', name: 'Operations' },
  { id: '10000000-0000-0000-0000-000000000004', name: 'People' },
  { id: '10000000-0000-0000-0000-000000000005', name: 'Customer Success' },
]
const locations = [
  { city: 'Mumbai', country_code: 'IN', id: '20000000-0000-0000-0000-000000000001', name: 'Mumbai HQ', state: 'Maharashtra' },
  { city: 'Pune', country_code: 'IN', id: '20000000-0000-0000-0000-000000000002', name: 'Pune Office', state: 'Maharashtra' },
  { city: 'Bengaluru', country_code: 'IN', id: '20000000-0000-0000-0000-000000000003', name: 'Bengaluru Hub', state: 'Karnataka' },
  { city: 'Hyderabad', country_code: 'IN', id: '20000000-0000-0000-0000-000000000004', name: 'Hyderabad Office', state: 'Telangana' },
]

await query(
  'showcase departments',
  supabase.from('departments').upsert(
    departments.map((department) => ({ ...department, is_active: true, organization_id: organizationId })),
    { onConflict: 'id' },
  ),
)
await query(
  'showcase locations',
  supabase.from('work_locations').upsert(
    locations.map((location) => ({ ...location, is_active: true, organization_id: organizationId })),
    { onConflict: 'id' },
  ),
)

const departmentId = Object.fromEntries(departments.map((department) => [department.name, department.id]))
const locationId = Object.fromEntries(locations.map((location) => [location.name, location.id]))
const credentialByKey = new Map(credentials.users.map((credential) => [credential.key, credential]))
type SeedEmployee = {
  annual: number; code: string; department: string; designation: string; location: string
  name: string; profileKey: string | null; status: 'active' | 'on_leave' | 'exit_pending' | 'draft' | 'inactive'
}
const employeeDefinitions: SeedEmployee[] = [
  { annual: 1920000, code: 'VF-001', department: 'Operations', designation: 'Founder & Owner', location: 'Mumbai HQ', name: 'Fardeen Ansari', profileKey: 'owner_primary', status: 'active' },
  { annual: 1380000, code: 'VF-002', department: 'Operations', designation: 'Platform Administrator', location: 'Mumbai HQ', name: 'Meera Sharma', profileKey: 'admin_primary', status: 'active' },
  { annual: 1240000, code: 'VF-003', department: 'People', designation: 'People Operations Lead', location: 'Hyderabad Office', name: 'Ananya Iyer', profileKey: 'hr_primary', status: 'active' },
  { annual: 1320000, code: 'VF-004', department: 'Finance', designation: 'Payroll Controller', location: 'Pune Office', name: 'Rohan Verma', profileKey: 'finance_primary', status: 'active' },
  { annual: 1460000, code: 'VF-005', department: 'Engineering', designation: 'Engineering Manager', location: 'Bengaluru Hub', name: 'Sneha Rao', profileKey: 'manager_primary', status: 'active' },
  { annual: 1080000, code: 'VF-006', department: 'Engineering', designation: 'Product Engineer', location: 'Bengaluru Hub', name: 'Aarav Mehta', profileKey: 'employee_primary', status: 'active' },
  { annual: 960000, code: 'VF-007', department: 'Customer Success', designation: 'Customer Success Partner', location: 'Hyderabad Office', name: 'Amina Yusuf', profileKey: 'employee_customer', status: 'active' },
  { annual: 1020000, code: 'VF-008', department: 'Engineering', designation: 'Quality Engineer', location: 'Bengaluru Hub', name: 'Arjun Patel', profileKey: 'employee_quality', status: 'on_leave' },
  { annual: 1180000, code: 'VF-009', department: 'Finance', designation: 'Financial Analyst', location: 'Pune Office', name: 'Priya Shah', profileKey: 'finance_analyst', status: 'exit_pending' },
  { annual: 840000, code: 'VF-010', department: 'People', designation: 'People Coordinator', location: 'Mumbai HQ', name: 'Kavya Joshi', profileKey: 'hr_partner', status: 'active' },
  { annual: 1260000, code: 'VF-011', department: 'Operations', designation: 'Operations Administrator', location: 'Mumbai HQ', name: 'Aditya Nair', profileKey: 'admin_operations', status: 'active' },
  { annual: 1400000, code: 'VF-012', department: 'Customer Success', designation: 'Customer Success Manager', location: 'Hyderabad Office', name: 'Vikram Desai', profileKey: 'manager_success', status: 'active' },
  ...[
    ['Zara Ahmed', 'Engineering', 'Backend Engineer', 1120000],
    ['Dev Malhotra', 'Engineering', 'Product Designer', 1050000],
    ['Ishita Sen', 'Engineering', 'Data Engineer', 1160000],
    ['Kabir Sethi', 'Customer Success', 'Account Specialist', 780000],
    ['Neha Menon', 'Customer Success', 'Support Lead', 880000],
    ['Samira Hassan', 'People', 'Talent Partner', 920000],
    ['Sanjay Gupta', 'Finance', 'Accounts Specialist', 860000],
    ['Pooja Kulkarni', 'Operations', 'Office Coordinator', 680000],
    ['Arjun Rao', 'Engineering', 'Platform Engineer', 1220000],
    ['Riya Kapoor', 'Customer Success', 'Onboarding Specialist', 820000],
    ['Yash Agarwal', 'Engineering', 'Graduate Engineer', 720000],
    ['Diya Shah', 'Operations', 'Operations Associate', 640000],
  ].map(([name, department, designation, annual], index): SeedEmployee => ({
    annual: Number(annual), code: `VF-${String(index + 13).padStart(3, '0')}`,
    department: String(department), designation: String(designation), location: index % 2 ? 'Hyderabad Office' : 'Bengaluru Hub',
    name: String(name), profileKey: null, status: index === 10 ? 'draft' : index === 11 ? 'inactive' : 'active',
  })),
]

const employeeRows = employeeDefinitions.map((employee, index) => ({
  annual_compensation: employee.annual,
  bank_account_holder_name: employee.name,
  bank_account_number: `900000000${String(index + 1).padStart(3, '0')}`,
  bank_name: index % 2 === 0 ? 'HDFC Bank (sample account)' : 'State Bank of India (sample account)',
  bank_routing_code: index % 2 === 0 ? 'HDFC0001234' : 'SBIN0001234',
  department_id: departmentId[employee.department],
  designation: employee.designation,
  employee_code: employee.code,
  full_name: employee.name,
  joining_date: `${2023 + (index % 3)}-${String((index % 9) + 1).padStart(2, '0')}-15`,
  location: locations.find((location) => location.id === locationId[employee.location])?.city ?? 'Mumbai',
  organization_id: organizationId,
  profile_id: employee.profileKey ? authUsersByKey.get(employee.profileKey).id : null,
  status: employee.status,
  updated_at: new Date().toISOString(),
  work_email: employee.profileKey ? credentialByKey.get(employee.profileKey)?.email : `${employee.name.toLowerCase().replaceAll(' ', '.')}@vetanflow.example.com`,
  work_location_id: locationId[employee.location],
}))

const seededEmployees = await query(
  'showcase employees',
  supabase.from('employees').upsert(employeeRows, { onConflict: 'organization_id,employee_code' }).select('id,employee_code'),
)
const employeeId = Object.fromEntries(
  seededEmployees.map((employee: { employee_code: string; id: string }) => [employee.employee_code, employee.id]),
)
const managerProfileId = authUsers.get('manager').id

await query(
  'showcase reporting lines',
  supabase
    .from('employees')
    .update({ manager_employee_id: employeeId['VF-005'], manager_profile_id: managerProfileId })
    .eq('organization_id', organizationId)
    .in('employee_code', ['VF-006', 'VF-008', 'VF-013', 'VF-014', 'VF-015', 'VF-021', 'VF-023']),
)
await query(
  'customer success reporting line',
  supabase
    .from('employees')
    .update({ manager_employee_id: employeeId['VF-012'], manager_profile_id: authUsersByKey.get('manager_success').id })
    .eq('organization_id', organizationId)
    .in('employee_code', ['VF-007', 'VF-016', 'VF-017', 'VF-022']),
)
await query(
  'leadership reporting lines',
  supabase
    .from('employees')
    .update({ manager_employee_id: employeeId['VF-001'], manager_profile_id: authUsers.get('owner').id })
    .eq('organization_id', organizationId)
    .in('employee_code', ['VF-002', 'VF-003', 'VF-004', 'VF-005', 'VF-011', 'VF-012']),
)

await query(
  'showcase compensation history',
  supabase.from('salary_revisions').upsert(
    employeeDefinitions.flatMap((employee, index) => {
      const joiningYear = Number(employeeRows[index].joining_date.slice(0, 4))
      const currentYear = new Date().getUTCFullYear()
      const totalYears = currentYear - joiningYear
      const startingSalary = Math.round(employee.annual / Math.pow(1.08, totalYears))
      
      const base = {
        created_by: authUsers.get(index < 2 ? 'owner' : 'hr').id,
        currency_code: 'INR',
        employee_id: employeeId[employee.code],
        organization_id: organizationId,
      }
      
      const rows = [{ 
        ...base, 
        annual_compensation: startingSalary,
        effective_from: employeeRows[index].joining_date,
        reason: 'Showcase compensation baseline'
      }]

      for (let year = joiningYear + 1; year <= currentYear; year++) {
        rows.push({
          ...base,
          annual_compensation: Math.round(employee.annual / Math.pow(1.08, currentYear - year)),
          effective_from: `${year}-01-01`,
          reason: 'Annual compensation review',
        })
      }

      return rows
    }),
    { onConflict: 'employee_id,effective_from' },
  ),
)

const leaveDates = [
  getLeaveDates(5, 2),
  getLeaveDates(9, 3),
  getLeaveDates(-9, 2),
  getLeaveDates(-3),
  getLeaveDates(-15),
]
const leaveRows = [
  { approval_stage: 'manager', decision_note: null, employee_id: employeeId['VF-006'], id: '31000000-0000-0000-0000-000000000001', leave_type: 'vacation', reason: 'Planned personal time', requested_by: authUsers.get('employee').id, reviewed_at: null, reviewed_by: null, status: 'pending', ...leaveDates[0] },
  { approval_stage: 'hr', decision_note: 'Escalated for coverage review', employee_id: employeeId['VF-007'], escalated_at: new Date().toISOString(), escalated_by: authUsers.get('manager').id, id: '31000000-0000-0000-0000-000000000002', leave_type: 'personal', reason: 'Family commitment', requested_by: authUsers.get('hr').id, reviewed_at: null, reviewed_by: null, status: 'pending', ...leaveDates[1] },
  { approval_stage: 'closed', decision_note: 'Approved with team coverage confirmed', employee_id: employeeId['VF-008'], id: '31000000-0000-0000-0000-000000000003', leave_type: 'medical', reason: 'Recovery time', requested_by: authUsers.get('hr').id, reviewed_at: new Date().toISOString(), reviewed_by: authUsers.get('hr').id, status: 'approved', ...leaveDates[2] },
  { approval_stage: 'closed', decision_note: 'Critical release coverage required', employee_id: employeeId['VF-006'], id: '31000000-0000-0000-0000-000000000004', leave_type: 'personal', reason: 'Personal appointment', requested_by: authUsers.get('employee').id, reviewed_at: new Date().toISOString(), reviewed_by: authUsers.get('manager').id, status: 'rejected', ...leaveDates[3] },
  { approval_stage: 'closed', decision_note: 'Request withdrawn by employee', employee_id: employeeId['VF-006'], id: '31000000-0000-0000-0000-000000000005', leave_type: 'vacation', reason: 'Travel plans changed', requested_by: authUsers.get('employee').id, reviewed_at: new Date().toISOString(), reviewed_by: authUsers.get('employee').id, status: 'cancelled', ...leaveDates[4] },
  ...employeeDefinitions.slice(0, 19).map((employee, index) => {
    const status = ['pending', 'approved', 'rejected', 'cancelled'][index % 4]
    const dates = getLeaveDates(status === 'pending' ? 14 + index : -25 + index, 1 + index % 2)
    return {
      id: `31000000-0000-0000-0000-${String(index + 6).padStart(12, '0')}`,
      employee_id: employeeId[employee.code],
      leave_type: ['vacation', 'medical', 'personal'][index % 3],
      reason: ['Planned time off with handover arranged', 'Medical appointment', 'Family commitment'][index % 3],
      status, approval_stage: status === 'pending' ? 'hr' : 'closed',
      decision_note: status === 'pending' ? null : status === 'approved' ? 'Coverage confirmed by the team' : status === 'rejected' ? 'Please choose dates outside the team release window' : 'Plans changed; request withdrawn',
      requested_by: employee.profileKey ? authUsersByKey.get(employee.profileKey).id : authUsers.get('hr').id,
      reviewed_at: status === 'pending' ? null : new Date().toISOString(),
      reviewed_by: status === 'pending' ? null : authUsers.get('hr').id,
      ...dates,
    }
  }),
].map(({ endDate, startDate, ...row }) => ({
  ...row,
  end_date: endDate,
  organization_id: organizationId,
  start_date: startDate,
  updated_at: new Date().toISOString(),
}))

await query('showcase leave requests', supabase.from('leave_requests').upsert(leaveRows, { onConflict: 'id' }))

const currentMonth = dateOnly(monthStart(new Date()))
const currentLock = await query(
  'current attendance lock lookup',
  supabase.from('attendance_month_locks').select('id').eq('organization_id', organizationId).eq('period_month', currentMonth).maybeSingle(),
)

let attendanceCount = 0

if (!currentLock) {
  const workDates = getCurrentWorkDates()
  const attendanceEmployeeCodes = employeeDefinitions.filter((employee) => ['active', 'on_leave', 'exit_pending'].includes(employee.status)).map((employee) => employee.code)
  const attendanceRows = attendanceEmployeeCodes.flatMap((code, employeeIndex) =>
    workDates.map((workDate, dateIndex) => {
      const isHalfDay = code === 'VF-006' && dateIndex === Math.min(2, workDates.length - 1)
      const isAbsent = code === 'VF-007' && dateIndex === Math.min(3, workDates.length - 1)
      const hasOvertime = code === 'VF-004' && dateIndex === Math.min(4, workDates.length - 1)

      return {
        attendance_status: isHalfDay ? 'half_day' : isAbsent ? 'absent' : 'present',
        employee_id: employeeId[code],
        notes: 'Showcase attendance record',
        organization_id: organizationId,
        overtime_hours: hasOvertime ? 2 : 0,
        payable_hours: isHalfDay ? 4 : isAbsent ? 0 : 8,
        recorded_by: authUsers.get(employeeIndex % 2 === 0 ? 'hr' : 'manager').id,
        updated_at: new Date().toISOString(),
        work_date: workDate,
      }
    }),
  )

  await query(
    'showcase current attendance',
    supabase.from('attendance_entries').upsert(attendanceRows, { onConflict: 'employee_id,work_date' }),
  )
  attendanceCount = attendanceRows.length

  const wellnessDay = dateOnly(addDays(monthStart(new Date()), 9))
  await query(
    'showcase current holiday',
    supabase.from('holidays').upsert(
      {
        holiday_date: wellnessDay,
        name: 'Company wellness day',
        organization_id: organizationId,
        region: 'GLOBAL',
      },
      { onConflict: 'organization_id,holiday_date' },
    ),
  )
}

await query(
  'remove previous showcase audit events',
  supabase.from('audit_logs').delete().eq('organization_id', organizationId).contains('metadata', { source: 'showcase_seed' }),
)
await query(
  'showcase audit events',
  supabase.from('audit_logs').insert([
    { action: 'organization_preferences_updated', actor_id: authUsers.get('owner').id, entity_id: organizationId, entity_type: 'organization', metadata: { source: 'showcase_seed' }, organization_id: organizationId },
    { action: 'employee_created', actor_id: authUsers.get('hr').id, entity_id: employeeId['VF-010'], entity_type: 'employee', metadata: { employee_code: 'VF-010', source: 'showcase_seed' }, organization_id: organizationId },
    { action: 'compensation_revision_recorded', actor_id: authUsers.get('finance').id, entity_id: employeeId['VF-006'], entity_type: 'employee', metadata: { source: 'showcase_seed' }, organization_id: organizationId },
    { action: 'leave_request_escalated', actor_id: authUsers.get('manager').id, entity_id: '31000000-0000-0000-0000-000000000002', entity_type: 'leave_request', metadata: { source: 'showcase_seed' }, organization_id: organizationId },
    { action: 'attendance_entry_updated', actor_id: authUsers.get('hr').id, entity_id: employeeId['VF-006'], entity_type: 'attendance_entry', metadata: { period_month: currentMonth, source: 'showcase_seed' }, organization_id: organizationId },
    { action: 'role_assignments_seeded', actor_id: authUsers.get('owner').id, entity_id: organizationId, entity_type: 'user_role', metadata: { role_count: credentials.users.length, source: 'showcase_seed' }, organization_id: organizationId },
  ]),
)

mkdirSync(join(root, '.tmp'), { recursive: true })
writeFileSync(credentialPath, `${JSON.stringify(credentials, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })

console.log('VetanFlow showcase foundation seeded')
console.log(`Organization: ${organizationId}`)
console.log(`Role accounts: ${credentials.users.length}`)
console.log(`Employees prepared: ${employeeDefinitions.length}`)
console.log(`Leave requests prepared: ${leaveRows.length}`)
console.log(`Current attendance rows prepared: ${attendanceCount}`)
console.log('Credentials saved to ignored local file: .tmp/demo-credentials.json')
