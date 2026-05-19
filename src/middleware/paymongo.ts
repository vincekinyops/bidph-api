import { createMiddleware } from 'hono/factory'
import { hmacSha256Hex, timingSafeEqualString } from '../lib/crypto.js'
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
    const expected = await hmacSha256Hex(secret, rawBody)
    const provided = signature.replace(/^sha256=/, '')

    if (!timingSafeEqualString(expected, provided)) {
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid webhook signature' } }, 401)
    }

    await next()
  })
}
