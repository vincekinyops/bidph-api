import type { ErrorHandler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export const errorHandler: ErrorHandler = (err, c) => {
  const requestId = c.get('requestId' as never) as string | undefined
  console.error(`[${requestId}]`, err)

  if ('status' in err && typeof err.status === 'number') {
    const status = err.status as ContentfulStatusCode
    return c.json(
      {
        error: {
          code: 'REQUEST_ERROR',
          message: err.message,
        },
      },
      status,
    )
  }

  return c.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    },
    500,
  )
}
