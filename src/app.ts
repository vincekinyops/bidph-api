import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import type { Env } from './env.js'
import { errorHandler } from './middleware/error-handler.js'
import { requestId } from './middleware/request-id.js'
import { requireAuth } from './middleware/auth.js'
import { verifyPaymongoSignature } from './middleware/paymongo.js'
import { meRoutes } from './routes/v1/me.js'
import { paymongoWebhookRoutes } from './routes/v1/webhooks/paymongo.js'

export type AppVariables = {
  requestId: string
  userId: string
}

export function createApp(config: Env) {
  const app = new Hono<{ Variables: AppVariables }>()

  app.use('*', requestId)
  app.use('*', logger())
  app.use(
    '*',
    cors({
      origin: config.CORS_ORIGIN,
      allowHeaders: ['Authorization', 'Content-Type'],
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  )
  app.use('*', secureHeaders())

  app.onError(errorHandler)

  app.get('/health', (c) =>
    c.json({ ok: true, service: 'bidph-api', requestId: c.get('requestId') }),
  )

  const paymongo = paymongoWebhookRoutes(config)
  paymongo.use('*', verifyPaymongoSignature(config))
  app.route('/api/v1/webhooks/paymongo', paymongo)

  const authed = new Hono<{ Variables: AppVariables }>()
  authed.use('*', requireAuth(config))
  authed.route('/me', meRoutes(config))

  app.route('/api/v1', authed)

  return app
}
