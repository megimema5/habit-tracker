import type { RequestHandler } from 'express';
import type { z } from 'zod';

type RequestPart = 'body' | 'params' | 'query';

/**
 * Validates one part of the request with a zod schema before the controller runs.
 *
 *   router.post('/', validate(createHabitSchema), controller.create)
 *
 * - Valid → the parsed (trimmed, lowercased, coerced…) value replaces the original,
 *   so controllers only ever see clean data.
 * - Invalid → the ZodError goes to the error handler, which answers 400 with field errors.
 */
export function validate(schema: z.ZodType, part: RequestPart = 'body'): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      next(result.error);
      return;
    }

    if (part === 'query') {
      // In Express 5, req.query is a read-only getter, so it has to be redefined.
      Object.defineProperty(req, 'query', { value: result.data, writable: true });
    } else {
      req[part] = result.data;
    }
    next();
  };
}
