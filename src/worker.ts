import { createApp } from './app.js'
import { parseEnv } from './env.js'

/** Cloudflare Worker bindings (set via wrangler vars / secrets). */
export type WorkerEnv = {
  NODE_ENV?: string
  CORS_ORIGIN?: string
  SUPABASE_URL: string
  SUPABASE_SECRET_KEY?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  PAYMONGO_WEBHOOK_SECRET?: string
  CRON_SECRET?: string
}

let app: ReturnType<typeof createApp>

function getApp(env: WorkerEnv) {
  if (!app) {
    app = createApp(parseEnv(env))
  }
  return app
}

export default {
  fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext) {
    return getApp(env).fetch(request, env, ctx)
  },
} satisfies ExportedHandler<WorkerEnv>
