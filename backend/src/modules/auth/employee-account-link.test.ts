import { describe, expect, it, vi } from 'vitest'
import { findEmployeeForAccount, linkInvitedEmployee, normalizeWorkEmail, resolveEmployeeProfile } from './employee-account-link.js'

function database(results: Array<{ data: unknown; error?: unknown }>) {
  const calls: Array<{ table: string; method: string; args: unknown[] }> = []
  const client = { from: vi.fn((table: string) => {
    const result = results.shift()
    if (!result) throw new Error('Unexpected database query')
    const chain: Record<string, unknown> = { then: (resolve: (value: unknown) => unknown) => Promise.resolve({ error: null, ...result }).then(resolve) }
    for (const method of ['select', 'eq', 'ilike', 'limit', 'single', 'maybeSingle', 'update', 'is']) {
      chain[method] = (...args: unknown[]) => { calls.push({ table, method, args }); return chain }
    }
    return chain
  }) }
  return { client: client as unknown as Parameters<typeof findEmployeeForAccount>[0], calls }
}

describe('employee account linking', () => {
  it('normalizes email and treats SQL wildcard characters literally', async () => {
    const db = database([{ data: [] }])
    expect(normalizeWorkEmail(' Aarav@Example.com ')).toBe('aarav@example.com')
    await findEmployeeForAccount(db.client, 'org-a', ' Test_%@Example.com ')
    expect(db.calls).toContainEqual({ table: 'employees', method: 'eq', args: ['organization_id', 'org-a'] })
    expect(db.calls).toContainEqual({ table: 'employees', method: 'ilike', args: ['work_email', 'test\\_\\%@example.com'] })
  })

  it('links an employee created after their account', async () => {
    const db = database([{ data: [] }, { data: [{ id: 'account-a' }] }, { data: [] }])
    expect(await resolveEmployeeProfile(db.client, 'org-a', 'aarav@example.com')).toBe('account-a')
  })

  it('leaves an employee without an account unlinked', async () => {
    const db = database([{ data: [] }, { data: [] }])
    expect(await resolveEmployeeProfile(db.client, 'org-a', 'aarav@example.com')).toBeNull()
  })

  it('rejects duplicate employee emails and ambiguous account matches', async () => {
    const duplicate = database([{ data: [{ id: 'a' }, { id: 'b' }] }])
    await expect(findEmployeeForAccount(duplicate.client, 'org-a', 'a@example.com')).rejects.toThrow('Multiple employee')
    const ambiguous = database([{ data: [] }, { data: [{ id: 'a' }, { id: 'b' }] }])
    await expect(resolveEmployeeProfile(ambiguous.client, 'org-a', 'a@example.com')).rejects.toThrow('Multiple accounts')
  })

  it('does not reassign a login already attached to another employee', async () => {
    const db = database([{ data: [] }, { data: [{ id: 'account-a' }] }, { data: [{ id: 'other-employee' }] }])
    await expect(resolveEmployeeProfile(db.client, 'org-a', 'a@example.com')).rejects.toThrow('already linked')
  })

  it('preserves an existing link and rejects changing its email independently', async () => {
    const db = database([{ data: [{ id: 'employee-a', profile_id: 'account-a' }] }, { data: { email: 'A@Example.com' } }])
    expect(await resolveEmployeeProfile(db.client, 'org-a', 'a@example.com', 'employee-a', 'account-a')).toBe('account-a')
    const changed = database([{ data: [] }, { data: { email: 'a@example.com' } }])
    await expect(resolveEmployeeProfile(changed.client, 'org-a', 'b@example.com', 'employee-a', 'account-a')).rejects.toThrow('Update the account email')
  })

  it('links an account invited after its employee record, conditionally', async () => {
    const db = database([{ data: [{ id: 'employee-a', profile_id: null }] }, { data: { id: 'employee-a' } }])
    await linkInvitedEmployee(db.client, 'org-a', 'a@example.com', 'account-a')
    expect(db.calls).toContainEqual({ table: 'employees', method: 'update', args: [{ profile_id: 'account-a' }] })
    expect(db.calls).toContainEqual({ table: 'employees', method: 'is', args: ['profile_id', null] })
  })

  it('fails closed when an employee is linked concurrently or belongs to another account', async () => {
    const race = database([{ data: [{ id: 'employee-a', profile_id: null }] }, { data: null }])
    await expect(linkInvitedEmployee(race.client, 'org-a', 'a@example.com', 'account-a')).rejects.toThrow('access changed')
    const linked = database([{ data: [{ id: 'employee-a', profile_id: 'account-b' }] }])
    await expect(linkInvitedEmployee(linked.client, 'org-a', 'a@example.com', 'account-a')).rejects.toThrow('already linked')
  })

  it('propagates database failures without linking', async () => {
    const error = new Error('Database unavailable')
    const db = database([{ data: null, error }])
    await expect(findEmployeeForAccount(db.client, 'org-a', 'a@example.com')).rejects.toBe(error)
  })
})
