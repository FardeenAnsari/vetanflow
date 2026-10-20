import express from 'express'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { createAuthRouter } from './auth.js'

describe('workspace access route', () => {
  it('requires authentication even when development fixtures are enabled', async () => {
    const app = express().use('/auth', createAuthRouter())
    await request(app).get('/auth/workspace').expect(401)
  })
  it('returns an actionable unassigned-account response without caching it', async () => {
    const resolve = vi.fn().mockResolvedValue({ status: 'unassigned' })
    const app = express()
    app.use((_, res, next) => { res.locals.auth = { userId: 'legacy', accessToken: 'token', email: 'aarav@vetanflow.test' }; next() })
    app.use('/auth', createAuthRouter(resolve))
    const response = await request(app).get('/auth/workspace').expect(403)
    expect(response.body.code).toBe('workspace_unassigned')
    expect(response.headers['cache-control']).toBe('no-store')
    expect(resolve).toHaveBeenCalledWith('legacy')
  })
})
