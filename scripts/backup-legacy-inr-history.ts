import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

process.loadEnvFile('backend/.env')
assert(process.env.SUPABASE_URL?.includes('indlpqjabkkdwsrxeokq'), 'Unexpected Supabase project')
const { getSupabaseServiceClient } = await import('../backend/src/lib/supabase.js')
const db = getSupabaseServiceClient()!
const organizationId = '00000000-0000-0000-0000-000000000001'
async function checked(request: any): Promise<any[]> {
  const { data, error } = await request
  assert.ifError(error)
  return data
}

const runs = await checked(db.from('payroll_runs').select('*').eq('organization_id', organizationId)
  .gte('period_start', '2026-01-01').lt('period_start', '2026-07-01'))
assert.equal(runs.length, 6, 'Expected exactly the six approved legacy sample periods')
assert(runs.every((run) => run.status === 'finalized'))
const lines = await checked(db.from('payroll_run_lines').select('*').in('payroll_run_id', runs.map((run) => run.id)))
assert.equal(lines.length, 54)
assert(lines.every((line) => line.calculation_snapshot?.source?.version === 'demo_prepare_v1' && !line.calculation_snapshot?.money))
const payslips = await checked(db.from('payslips').select('*').in('payroll_run_line_id', lines.map((line) => line.id)))
assert.equal(payslips.length, 54)
const adjustments = await checked(db.from('payroll_adjustments').select('*').in('payroll_run_id', runs.map((run) => run.id)))
const attendance = await checked(db.from('attendance_entries').select('*').eq('organization_id', organizationId)
  .gte('work_date', '2026-01-01').lt('work_date', '2026-07-01'))
const locks = await checked(db.from('attendance_month_locks').select('*').eq('organization_id', organizationId)
  .gte('period_month', '2026-01-01').lt('period_month', '2026-07-01'))
const directory = join('.tmp', `legacy-history-backup-${Date.now()}`)
mkdirSync(join(directory, 'payslips'), { recursive: true, mode: 0o700 })
writeFileSync(join(directory, 'records.json'), JSON.stringify({ organizationId, runs, lines, payslips, adjustments, attendance, locks }, null, 2), { mode: 0o600 })
for (const slip of payslips) {
  const result = await db.storage.from('payslips').download(slip.storage_path)
  assert.ifError(result.error)
  const bytes = Buffer.from(await result.data!.arrayBuffer())
  assert(bytes.subarray(0, 4).equals(Buffer.from('%PDF')), 'Invalid historical PDF')
  writeFileSync(join(directory, 'payslips', `${slip.id}.pdf`), bytes, { mode: 0o600 })
}
console.log(`Backed up ${runs.length} periods, ${lines.length} lines, ${payslips.length} PDFs, ${attendance.length} attendance entries, and ${locks.length} locks to ${directory}`)
