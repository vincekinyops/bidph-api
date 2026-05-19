import { serve } from '@hono/node-server'
import { createApp } from './app.js'
import { loadEnv } from './env.js'

const config = loadEnv()
const app = createApp(config)

serve(
  {
    fetch: app.fetch,
    port: config.PORT,
  },
  (info) => {
    console.log(`bidph-api listening on http://localhost:${info.port}`)
  },
)
