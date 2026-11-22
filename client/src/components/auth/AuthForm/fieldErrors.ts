import { ApiRequestError } from '../../../api/client';

export type FieldErrors = Partial<Record<string, string>>;

/** zod issues → { email: 'Enter a valid email address', … } (first message per field). */
export function issuesToFieldErrors(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const field = String(issue.path[0] ?? '');
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}

/**
 * Turns a failed request into something the form can show:
 * field errors next to inputs, or one message at the top of the form.
 */
export function describeApiError(err: unknown): { fieldErrors: FieldErrors; formError?: string } {
  if (!(err instanceof ApiRequestError)) {
    return { fieldErrors: {}, formError: 'Something went wrong. Please try again.' };
  }

  if (err.status === 409) {
    return { fieldErrors: { email: err.message } }; // "Email already in use"
  }

  const fromServer = Object.fromEntries(
    Object.entries(err.fieldErrors).map(([field, messages]) => [field, messages[0]]),
  ) as FieldErrors;
  if (Object.keys(fromServer).length > 0) return { fieldErrors: fromServer };

  return { fieldErrors: {}, formError: err.message };
}
