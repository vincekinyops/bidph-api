import { createMiddleware } from 'hono/factory'
import { createClient } from '@supabase/supabase-js'
import type { Env } from '../env.js'

export type AuthVariables = {
  userId: string
}

export function requireAuth(config: Env) {
  return createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    const header = c.req.header('Authorization')
    if (!header?.startsWith('Bearer ')) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'Missing bearer token' } }, 401)
    }

    const token = header.slice('Bearer '.length).trim()
    if (!token) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'Missing bearer token' } }, 401)
    }

    const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SECRET_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } }, 401)
    }

    c.set('userId', data.user.id)
    await next()
  })
}
