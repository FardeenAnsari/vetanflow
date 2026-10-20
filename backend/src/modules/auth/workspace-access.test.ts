import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ client: vi.fn(), roles: vi.fn() }))
vi.mock('../../lib/supabase.js', () => ({ getSupabaseServiceClient: mocks.client }))
vi.mock('./roles.js', () => ({ getUserRoles: mocks.roles }))
import { resolveWorkspaceAccess } from './workspace-access.js'

describe('workspace access', () => {
  beforeEach(() => vi.resetAllMocks())
  function profile(data: unknown, error: unknown = null) {
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data, error }) }
    mocks.client.mockReturnValue({ from: vi.fn().mockReturnValue(query) })
    return query
  }
  it('rejects an orphaned legacy identity without granting a role', async () => {
    const query = profile(null)
    expect(await resolveWorkspaceAccess('legacy-user')).toEqual({ status: 'unassigned' })
    expect(query.eq).toHaveBeenCalledWith('id', 'legacy-user')
    expect(mocks.roles).not.toHaveBeenCalled()
  })
  it('rejects an organization profile with no role', async () => {
    profile({ organization_id: 'org-a' })
    mocks.roles.mockResolvedValue([])
    expect(await resolveWorkspaceAccess('user-a')).toEqual({ status: 'unassigned' })
  })
  it('only returns verified user and organization assignments', async () => {
    profile({ organization_id: 'org-a' })
    mocks.roles.mockResolvedValue(['hr'])
    expect(await resolveWorkspaceAccess('user-a')).toEqual({ status: 'ok', data: { userId: 'user-a', organizationId: 'org-a', roles: ['hr'] } })
    expect(mocks.roles).toHaveBeenCalledWith('user-a', 'org-a')
  })
  it('fails closed for unknown roles', async () => {
    profile({ organization_id: 'org-a' })
    mocks.roles.mockResolvedValue(['superadmin'])
    expect(await resolveWorkspaceAccess('user-a')).toEqual({ status: 'unassigned' })
  })
  it('propagates database outages separately from missing assignments', async () => {
    const error = new Error('Database unavailable')
    profile(null, error)
    await expect(resolveWorkspaceAccess('user-a')).rejects.toBe(error)
  })
})
