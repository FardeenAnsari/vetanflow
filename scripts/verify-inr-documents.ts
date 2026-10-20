import assert from 'node:assert/strict'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

if (!process.argv.includes('--refresh-sample')) throw new Error('Use --refresh-sample to regenerate the sample PDFs.')
process.loadEnvFile('backend/.env')
assert(process.env.SUPABASE_URL?.includes('indlpqjabkkdwsrxeokq'), 'Unexpected Supabase project')
const { getSupabaseServiceClient } = await import('../backend/src/lib/supabase.js')
const { createPayslipRepository } = await import('../backend/src/modules/payroll/payslip-service.js')
const db = getSupabaseServiceClient()!
const organizationId = '00000000-0000-0000-0000-000000000001'
const owner = await db.from('user_roles').select('user_id').eq('organization_id', organizationId).eq('role', 'owner').single()
assert.ifError(owner.error)
const runs = await db.from('payroll_runs').select('id,period_start').eq('organization_id', organizationId).order('period_start')
assert.ifError(runs.error)
assert.equal(runs.data!.length, 9)
const directory = '.tmp/inr-document-proof'
mkdirSync(directory, { recursive: true, mode: 0o700 })
const results: Array<{ period: string; payslips: number }> = []
for (const run of runs.data!) {
  const generated = await createPayslipRepository().createForRun(run.id, owner.data!.user_id)
  assert.equal(generated.status, 'updated')
  assert.equal(generated.data!.length, 22)
  const slip = await db.from('payslips').select('storage_path')
    .eq('payroll_run_line_id', generated.data![0].payrollRunLineId).single()
  assert.ifError(slip.error)
  const file = await db.storage.from('payslips').download(slip.data!.storage_path)
  assert.ifError(file.error)
  const bytes = Buffer.from(await file.data!.arrayBuffer())
  const text = bytes.toString('latin1')
  assert(text.startsWith('%PDF'))
  assert(text.includes('INR '), 'PDF is missing INR amounts')
  assert(!text.includes('USD '), 'PDF still contains USD amounts')
  assert(text.includes(generated.data![0].employeeName), 'PDF has stale employee identity')
  writeFileSync(join(directory, `${run.period_start}.pdf`), bytes, { mode: 0o600 })
  results.push({ period: run.period_start, payslips: generated.data!.length })
  console.log(`[PASS] ${run.period_start}: 22 payslips refreshed; sample PDF has INR and current employee name`)
}
writeFileSync(join(directory, 'results.json'), JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2), { mode: 0o600 })

const backup = process.env.LEGACY_HISTORY_BACKUP
if (backup) {
  const old = JSON.parse(readFileSync(join(backup, 'records.json'), 'utf8'))
  assert.equal(old.organizationId, organizationId)
  assert.equal(old.payslips.length, 54)
  assert(old.payslips.every((slip: { id: string; storage_path: string }) =>
    slip.storage_path.startsWith(`${organizationId}/`) && existsSync(join(backup, 'payslips', `${slip.id}.pdf`))))
  const paths = old.payslips.map((slip: { storage_path: string }) => slip.storage_path)
  const referenced = await db.from('payslips').select('id').in('storage_path', paths)
  assert.ifError(referenced.error)
  assert.equal(referenced.data!.length, 0, 'Legacy objects still have active references')
  const removed = await db.storage.from('payslips').remove(paths)
  assert.ifError(removed.error)
  console.log('Removed 54 unreferenced legacy Storage objects; private local PDF backups retained.')
}
