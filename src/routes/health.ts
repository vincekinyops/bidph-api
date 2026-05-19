import { Hono } from 'hono'
import type { AppVariables } from '../app.js'

export const healthRoutes = new Hono<{ Variables: AppVariables }>()

function healthPayload(requestId: string) {
  return {
    ok: true,
    service: 'bidph-api',
    timestamp: new Date().toISOString(),
    requestId,
  }
}

healthRoutes.get('/', (c) => c.json(healthPayload(c.get('requestId'))))

healthRoutes.on('HEAD', '/', (c) => {
  c.header('X-Request-Id', c.get('requestId'))
  return c.body(null, 200)
})
