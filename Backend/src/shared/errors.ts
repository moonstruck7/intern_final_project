export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: 'NOT_FOUND' | 'INTERNAL_ERROR',
    message: string,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}
