import type { Session } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ fetch: vi.fn(), signIn: vi.fn(), setSession: vi.fn(), isolatedSignOut: vi.fn(), sharedSignOut: vi.fn() }))
vi.mock('./api-client', () => ({ apiFetch: mocks.fetch }))
vi.mock('./supabase', () => ({
  supabase: { auth: { setSession: mocks.setSession, signOut: mocks.sharedSignOut } },
  createIsolatedAuthClient: () => ({ auth: { signInWithPassword: mocks.signIn, signOut: mocks.isolatedSignOut } }),
}))
import { signInToWorkspace } from './workspace-auth'
const session = { access_token: 'employee-token', refresh_token: 'employee-refresh', user: { id: 'employee' } } as Session
describe('workspace sign-in and account replacement', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.signIn.mockResolvedValue({ data: { session }, error: null })
    mocks.setSession.mockResolvedValue({ data: { session }, error: null })
    mocks.isolatedSignOut.mockResolvedValue({ error: null })
  })
  it('checks workspace access before replacing the current account', async () => {
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ data: { userId: 'employee', roles: ['employee'] } }) })
    await signInToWorkspace(' EMPLOYEE@Example.com ', 'password')
    expect(mocks.signIn).toHaveBeenCalledWith({ email: 'employee@example.com', password: 'password' })
    expect(mocks.fetch).toHaveBeenCalledWith('/api/auth/workspace', expect.objectContaining({ headers: { Authorization: 'Bearer employee-token' } }))
    expect(mocks.fetch.mock.invocationCallOrder[0]).toBeLessThan(mocks.setSession.mock.invocationCallOrder[0])
    expect(mocks.sharedSignOut).not.toHaveBeenCalled()
  })
  it('does not replace a valid existing session with an orphaned legacy account', async () => {
    mocks.fetch.mockResolvedValue({ ok: false, json: async () => ({ error: 'No workspace assigned' }) })
    await expect(signInToWorkspace('aarav@vetanflow.test', 'password')).rejects.toThrow('No workspace assigned')
    expect(mocks.setSession).not.toHaveBeenCalled()
    expect(mocks.sharedSignOut).not.toHaveBeenCalled()
    expect(mocks.isolatedSignOut).toHaveBeenCalledWith({ scope: 'local' })
  })
  it('does not alter the current account on an invalid password', async () => {
    mocks.signIn.mockResolvedValue({ error: new Error('Invalid login credentials') })
    await expect(signInToWorkspace('employee@example.com', 'wrong')).rejects.toThrow('Invalid login credentials')
    expect(mocks.fetch).not.toHaveBeenCalled()
    expect(mocks.setSession).not.toHaveBeenCalled()
  })
  it('rejects a workspace belonging to another identity', async () => {
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ data: { userId: 'hr', roles: ['hr'] } }) })
    await expect(signInToWorkspace('employee@example.com', 'password')).rejects.toThrow('does not belong')
    expect(mocks.setSession).not.toHaveBeenCalled()
  })
  it('does not wait for failed-session cleanup to show the login error', async () => {
    mocks.fetch.mockRejectedValue(new Error('Network unavailable'))
    mocks.isolatedSignOut.mockReturnValue(new Promise(() => {}))
    await expect(signInToWorkspace('employee@example.com', 'password')).rejects.toThrow('Network unavailable')
    expect(mocks.setSession).not.toHaveBeenCalled()
  })
})
