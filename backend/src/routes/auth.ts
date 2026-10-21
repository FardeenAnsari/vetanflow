import { Router } from 'express'
import { requireAuth } from '../modules/auth/auth-middleware.js'
import { resolveWorkspaceAccess } from '../modules/auth/workspace-access.js'

export function createAuthRouter(resolveAccess = resolveWorkspaceAccess) {
  const router = Router()
  router.get('/workspace', requireAuth, async (_, res) => {
    res.setHeader('Cache-Control', 'no-store')
    if (!res.locals.auth) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }
    try {
      const result = await resolveAccess(res.locals.auth.userId)
      if (result.status === 'not_configured') {
        res.status(503).json({ error: 'Workspace access is temporarily unavailable. Try again shortly.' })
      } else if (result.status === 'unassigned') {
        res.status(403).json({ code: 'workspace_unassigned', error: 'This account has no VetanFlow workspace assigned. Use a current demo account or ask the organization owner to invite you.' })
      } else {
        res.json({ data: result.data })
      }
    } catch (error) {
      console.error(error)
      res.status(503).json({ error: 'Workspace access could not be checked. Try again shortly.' })
    }
  })
  return router
}
