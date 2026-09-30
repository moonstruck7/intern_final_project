export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: 'NOT_FOUND' | 'INTERNAL_ERROR' | 'VALIDATION_ERROR' | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'AUTH_NOT_CONFIGURED',
    message: string,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}
