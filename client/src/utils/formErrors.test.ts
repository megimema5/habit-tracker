import { describe, expect, it } from 'vitest';
import { ApiRequestError } from '../api/client';
import { describeApiError, issuesToFieldErrors } from './formErrors';

describe('issuesToFieldErrors', () => {
  it('keeps the first message per field', () => {
    expect(
      issuesToFieldErrors([
        { path: ['email'], message: 'Enter a valid email' },
        { path: ['email'], message: 'Email is too long' },
        { path: ['password'], message: 'Too short' },
        { path: [], message: 'Form-level issue' },
      ]),
    ).toEqual({ email: 'Enter a valid email', password: 'Too short' });
  });
});

describe('describeApiError', () => {
  it('puts "email already in use" (409) on the email field', () => {
    expect(describeApiError(new ApiRequestError(409, 'Email already in use'))).toEqual({
      fieldErrors: { email: 'Email already in use' },
    });
  });

  it('maps server validation errors to fields', () => {
    const err = new ApiRequestError(400, 'Validation failed', {
      formErrors: [],
      fieldErrors: { name: ['Name is required'] },
    });
    expect(describeApiError(err)).toEqual({ fieldErrors: { name: 'Name is required' } });
  });

  it('shows other API errors at the top of the form', () => {
    expect(describeApiError(new ApiRequestError(401, 'Invalid email or password'))).toEqual({
      fieldErrors: {},
      formError: 'Invalid email or password',
    });
  });

  it('has a friendly fallback for unexpected errors', () => {
    expect(describeApiError(new TypeError('boom')).formError).toBe(
      'Something went wrong. Please try again.',
    );
  });
});
