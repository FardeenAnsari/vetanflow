import type { NextFunction, Request, Response } from 'express'
import { getSupabasePublicClient } from '../../lib/supabase.js'

function getBearerToken(req: Request) {
  const header = req.get('authorization')

  if (!header?.startsWith('Bearer ')) {
    return null
  }

  const token = header.slice('Bearer '.length).trim()

  return token.length > 0 ? token : null
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const supabase = getSupabasePublicClient()

  if (!supabase) {
    next()
    return
  }

  const accessToken = getBearerToken(req)

  if (!accessToken) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  const { data, error } = await supabase.auth.getUser(accessToken)

  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired session' })
    return
  }

  res.locals.auth = {
    accessToken,
    email: data.user.email ?? null,
    userId: data.user.id,
  }

  next()
}
