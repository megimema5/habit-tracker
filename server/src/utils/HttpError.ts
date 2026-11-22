/**
 * An error that knows which HTTP status it should produce.
 * Throw it anywhere (service, controller, middleware) and the central
 * error handler turns it into a JSON response:
 *
 *   throw new HttpError(404, 'Habit not found');
 */
export class HttpError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }

  static badRequest(message = 'Bad request', details?: unknown): HttpError {
    return new HttpError(400, message, details);
  }

  static unauthorized(message = 'Not authenticated'): HttpError {
    return new HttpError(401, message);
  }

  static notFound(message = 'Not found'): HttpError {
    return new HttpError(404, message);
  }

  static conflict(message = 'Conflict'): HttpError {
    return new HttpError(409, message);
  }
}
