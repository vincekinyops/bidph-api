import { Hono } from 'hono'
import { createAdminClient } from '../../../lib/supabase.js'
import type { Env } from '../../../env.js'

export function paymongoWebhookRoutes(config: Env) {
  const app = new Hono()

  app.post('/', async (c) => {
    let body: Record<string, unknown>
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: { code: 'BAD_REQUEST', message: 'Invalid JSON' } }, 400)
    }

    const data = body.data as Record<string, unknown> | undefined
    const attributes = data?.attributes as Record<string, unknown> | undefined
    const externalId = (data?.id as string) ?? `evt-${Date.now()}`
    const amountCentavos = attributes?.amount as number | undefined
    const metadata = attributes?.metadata as Record<string, string> | undefined
    const userId = metadata?.user_id
    const amount = amountCentavos ? amountCentavos / 100 : 0

    if (!userId || amount <= 0) {
      return c.json(
        { error: { code: 'BAD_REQUEST', message: 'Missing user_id or amount in metadata' } },
        400,
      )
    }

    const supabase = createAdminClient(config)
    const { error } = await supabase.rpc('process_cash_in_webhook', {
      p_external_id: externalId,
      p_event_type: (body.type as string) ?? 'payment.paid',
      p_payload: body,
      p_user_id: userId,
      p_amount: amount,
      p_idempotency_key: externalId,
    })

    if (error) {
      return c.json({ error: { code: 'DB_ERROR', message: error.message } }, 500)
    }

    return c.json({ received: true })
  })

  return app
}
