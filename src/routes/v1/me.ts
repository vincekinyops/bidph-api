import { Hono } from 'hono'
import { createAdminClient } from '../../lib/supabase.js'
import type { Env } from '../../env.js'
import type { AuthVariables } from '../../middleware/auth.js'

export function meRoutes(config: Env) {
  const app = new Hono<{ Variables: AuthVariables }>()

  app.get('/', async (c) => {
    const userId = c.get('userId')
    const supabase = createAdminClient(config)

    const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle()
    if (error) {
      return c.json({ error: { code: 'DB_ERROR', message: error.message } }, 500)
    }
    if (!data) {
      return c.json({ error: { code: 'NOT_FOUND', message: 'User profile not found' } }, 404)
    }

    return c.json({ user: data })
  })

  return app
}
