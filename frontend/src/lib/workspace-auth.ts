import type { Session } from '@supabase/supabase-js'
import { apiFetch } from './api-client'
import { createIsolatedAuthClient, supabase } from './supabase'

export async function verifyWorkspaceSession(session: Session) {
  const response = await apiFetch('/api/auth/workspace', {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: 'no-store',
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.error ?? 'Workspace access could not be checked. Try again.')
  if (payload.data?.userId !== session.user.id || !payload.data?.roles?.length) {
    throw new Error('The workspace does not belong to this account. Please sign in again.')
  }
}

export async function installWorkspaceSession(session: Session) {
  if (!supabase) throw new Error('Supabase is not configured')
  await verifyWorkspaceSession(session)
  const installed = await supabase.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token })
  if (installed.error) throw installed.error
  if (installed.data.session?.user.id !== session.user.id) throw new Error('Account switching did not complete. Please retry.')
}

export async function signInToWorkspace(email: string, password: string) {
  const client = createIsolatedAuthClient()
  const result = await client.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
  if (result.error) throw result.error
  if (!result.data.session) throw new Error('Sign-in did not return a session. Please retry.')
  try {
    await installWorkspaceSession(result.data.session)
  } catch (error) {
    void client.auth.signOut({ scope: 'local' }).catch(() => undefined)
    throw error
  }
}
