import { createMiddleware } from 'hono/factory'
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { Env } from '../env.js'

export function verifyPaymongoSignature(config: Env) {
  return createMiddleware(async (c, next) => {
    const secret = config.PAYMONGO_WEBHOOK_SECRET
    if (!secret) {
      await next()
      return
    }

    const signature = c.req.header('paymongo-signature')
    if (!signature) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'Missing paymongo-signature' } }, 401)
    }

    const rawBody = await c.req.raw.clone().text()
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex')

    const provided = signature.replace(/^sha256=/, '')
    const a = Buffer.from(expected, 'hex')
    const b = Buffer.from(provided, 'hex')
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid webhook signature' } }, 401)
    }

    await next()
  })
}
