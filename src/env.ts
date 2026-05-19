import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  SUPABASE_URL: z.string().url(),
  /** New CLI: SECRET_KEY (`sb_secret_...`). Legacy: SERVICE_ROLE_KEY (JWT). */
  SUPABASE_SECRET_KEY: z.string().min(1),
  DATABASE_URL: z.string().optional(),
  PAYMONGO_WEBHOOK_SECRET: z.string().optional(),
  CRON_SECRET: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

type EnvSource = Record<string, string | undefined>

export function parseEnv(source: EnvSource): Env {
  const merged = {
    NODE_ENV: source.NODE_ENV,
    PORT: source.PORT,
    CORS_ORIGIN: source.CORS_ORIGIN,
    SUPABASE_URL: source.SUPABASE_URL,
    SUPABASE_SECRET_KEY: source.SUPABASE_SECRET_KEY ?? source.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: source.DATABASE_URL,
    PAYMONGO_WEBHOOK_SECRET: source.PAYMONGO_WEBHOOK_SECRET,
    CRON_SECRET: source.CRON_SECRET,
  }

  const parsed = envSchema.safeParse(merged)
  if (!parsed.success) {
    console.error('Invalid environment:', parsed.error.flatten().fieldErrors)
    throw new Error(
      'Invalid environment configuration. Set SUPABASE_URL and SUPABASE_SECRET_KEY (from `supabase status -o env`, field SECRET_KEY).',
    )
  }
  return parsed.data
}

/** Load config from process.env (Node local dev). */
export function loadEnv(): Env {
  return parseEnv(process.env as EnvSource)
}
