import { readFile } from 'node:fs/promises'
import { Router, type Request } from 'express'
import { rateLimit } from 'express-rate-limit'
import { createClient, type Session, type SupabaseClientOptions } from '@supabase/supabase-js'
import WebSocket from 'ws'
import { z } from 'zod'
import { getSupabasePublicConfig } from '../../config/env.js'

const credentialSchema = z.object({
  users: z.array(
    z.object({
      key: z.string().min(1),
      email: z.email(),
      fullName: z.string().min(1),
      password: z.string().min(12),
      role: z.enum(['owner', 'admin', 'hr', 'finance', 'manager', 'employee']),
    }),
  ),
})

type DemoCredential = z.infer<typeof credentialSchema>['users'][number]
type DemoDependencies = {
  readCredentials: () => Promise<DemoCredential[]>
  signIn: (credential: DemoCredential) => Promise<Session>
}

async function readCredentials() {
  const path = new URL('../../../../.tmp/demo-credentials.json', import.meta.url)
  return credentialSchema.parse(JSON.parse(await readFile(path, 'utf8'))).users
}

async function signIn(credential: DemoCredential) {
  const config = getSupabasePublicConfig()
  if (!config) throw new Error('Supabase is not configured')
  const client = createClient(config.url, config.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: {
      transport: WebSocket as unknown as NonNullable<
        SupabaseClientOptions<'public'>['realtime']
      >['transport'],
    },
  })
  const { data, error } = await client.auth.signInWithPassword({
    email: credential.email,
    password: credential.password,
  })
  if (error || !data.session) throw new Error('Demo sign-in failed')

  const roles = await client.from('user_roles').select('role').eq('user_id', data.user.id)
  if (roles.error || roles.data?.length !== 1 || roles.data[0].role !== credential.role) {
    await client.auth.signOut({ scope: 'local' })
    throw new Error('Demo role assignment does not match this account')
  }
  return data.session
}

function isLocalRequest(request: Request) {
  const address = request.socket.remoteAddress
  if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address ?? '')) return false
  try {
    const hostname = new URL(`http://${request.get('host')}`).hostname
    const origin = request.get('origin')
    return (
      ['localhost', '127.0.0.1', '[::1]'].includes(hostname) &&
      (!origin || ['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname))
    )
  } catch {
    return false
  }
}

export function createDemoRouter(dependencies: DemoDependencies = { readCredentials, signIn }) {
  const router = Router()
  router.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store')
    if (
      process.env.NODE_ENV === 'production' ||
      process.env.DEMO_ACCESS_ENABLED !== 'true' ||
      !isLocalRequest(req)
    ) {
      res.status(404).json({ error: 'Demo sign-in is available only during a local presentation.' })
      return
    }
    next()
  })
  router.use(
    rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, legacyHeaders: false, standardHeaders: 'draft-8' }),
  )
  router.get('/accounts', async (_, res) => {
    try {
      const credentials = await dependencies.readCredentials()
      res.json({
        data: credentials.map(({ key, email, fullName, role }) => ({ key, email, fullName, role })),
      })
    } catch {
      res.status(503).json({ error: 'Demo accounts are not ready. Run npm run demo:bootstrap first.' })
    }
  })
  router.post('/sessions', async (req, res) => {
    const parsed = z
      .object({ key: z.string().min(1).max(80) })
      .strict()
      .safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Choose a demo account.' })
      return
    }
    try {
      const credential = (await dependencies.readCredentials()).find((item) => item.key === parsed.data.key)
      if (!credential) {
        res.status(404).json({ error: 'Demo account not found.' })
        return
      }
      res.json({ data: await dependencies.signIn(credential) })
    } catch {
      res
        .status(503)
        .json({
          error:
            'Could not sign in to this demo account. Check the cloud connection and run demo:check-logins.',
        })
    }
  })
  return router
}
