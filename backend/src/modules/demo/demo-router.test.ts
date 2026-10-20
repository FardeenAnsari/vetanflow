import express from 'express'
import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '@supabase/supabase-js'
import { createDemoRouter } from './demo-router.js'

const credential = {
  key: 'employee_primary',
  email: 'employee.demo@vetanflow.example.com',
  fullName: 'Noah Williams',
  role: 'employee' as const,
  password: 'Local-demo-secret-123',
}
function buildApp() {
  const signIn = vi.fn().mockResolvedValue({ access_token: 'verified-demo-token' } as Session)
  const app = express()
  app.use(express.json())
  app.use('/api/demo', createDemoRouter({ readCredentials: async () => [credential], signIn }))
  return { app, signIn }
}
afterEach(() => vi.unstubAllEnvs())

describe('local demo entry', () => {
  it('is disabled unless explicitly enabled', async () => {
    vi.stubEnv('DEMO_ACCESS_ENABLED', '')
    await request(buildApp().app).get('/api/demo/accounts').expect(404)
  })
  it('cannot be enabled in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('DEMO_ACCESS_ENABLED', 'true')
    const { app, signIn } = buildApp()
    await request(app)
      .post('/api/demo/sessions')
      .set('Host', 'localhost')
      .send({ key: credential.key })
      .expect(404)
    expect(signIn).not.toHaveBeenCalled()
  })
  it('lists accounts without exposing passwords or tokens', async () => {
    vi.stubEnv('DEMO_ACCESS_ENABLED', 'true')
    const result = await request(buildApp().app)
      .get('/api/demo/accounts')
      .set('Host', 'localhost')
      .expect(200)
    expect(result.headers['cache-control']).toBe('no-store')
    expect(result.body.data).toEqual([
      { key: credential.key, email: credential.email, fullName: credential.fullName, role: 'employee' },
    ])
    expect(JSON.stringify(result.body)).not.toContain(credential.password)
  })
  it('rejects requests from non-local origins and hosts', async () => {
    vi.stubEnv('DEMO_ACCESS_ENABLED', 'true')
    const { app, signIn } = buildApp()
    await request(app)
      .post('/api/demo/sessions')
      .set('Host', 'localhost')
      .set('Origin', 'https://untrusted.example')
      .send({ key: credential.key })
      .expect(404)
    await request(app).get('/api/demo/accounts').set('Host', 'public.example').expect(404)
    expect(signIn).not.toHaveBeenCalled()
  })
  it('signs in only a known seed account', async () => {
    vi.stubEnv('DEMO_ACCESS_ENABLED', 'true')
    const { app, signIn } = buildApp()
    await request(app)
      .post('/api/demo/sessions')
      .set('Host', 'localhost')
      .send({ key: 'missing' })
      .expect(404)
    await request(app)
      .post('/api/demo/sessions')
      .set('Host', 'localhost')
      .send({ key: credential.key, role: 'owner' })
      .expect(400)
    const result = await request(app)
      .post('/api/demo/sessions')
      .set('Host', 'localhost')
      .send({ key: credential.key })
      .expect(200)
    expect(result.body.data.access_token).toBe('verified-demo-token')
    expect(signIn).toHaveBeenCalledExactlyOnceWith(credential)
  })
})
