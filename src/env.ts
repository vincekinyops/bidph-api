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

export function loadEnv(): Env {
  const merged = {
    ...process.env,
    SUPABASE_SECRET_KEY:
      process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
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
