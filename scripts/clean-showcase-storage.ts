import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
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

loadEnvFile(join(root, 'backend/.env'))

const { getSupabaseServiceClient } = await import('../backend/src/lib/supabase.js')
const supabase = getSupabaseServiceClient() as any

if (!supabase) {
  throw new Error('Supabase service client is not configured. Check backend/.env.')
}

const organizations = await query(
  'showcase organization safety check',
  supabase.from('organizations').select('name').eq('id', organizationId).limit(1),
)

if (organizations[0]?.name !== 'VetanFlow Labs') {
  throw new Error(`Refusing to clean Storage for organization ${organizationId}: expected VetanFlow Labs.`)
}

const runs = await query(
  'showcase payroll runs',
  supabase.from('payroll_runs').select('id').eq('organization_id', organizationId),
)
const runIds = runs.map((run: { id: string }) => run.id)

if (!runIds.length) {
  console.log('No showcase payslip objects need cleanup.')
  process.exit(0)
}

const lines = await query(
  'showcase payroll lines',
  supabase.from('payroll_run_lines').select('id').in('payroll_run_id', runIds),
)
const lineIds = lines.map((line: { id: string }) => line.id)

if (!lineIds.length) {
  console.log('No showcase payslip objects need cleanup.')
  process.exit(0)
}

const payslips = await query(
  'showcase payslip paths',
  supabase.from('payslips').select('storage_path').in('payroll_run_line_id', lineIds),
)
const storagePaths = payslips
  .map((payslip: { storage_path: string | null }) => payslip.storage_path)
  .filter((path: string | null): path is string => Boolean(path))

if (!storagePaths.length) {
  console.log('No showcase payslip objects need cleanup.')
  process.exit(0)
}

await query('remove showcase payslip objects', supabase.storage.from('payslips').remove(storagePaths))
console.log(`Removed ${storagePaths.length} showcase payslip object${storagePaths.length === 1 ? '' : 's'}.`)
