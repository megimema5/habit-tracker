import { useState, type ChangeEvent, type FormEvent } from 'react';
import { LIMITS, loginSchema, registerSchema } from '@habit/shared';
import { useAuth } from '../../../context/useAuth';
import { Button, Icon, Input } from '../../ui';
import { PasswordInput } from '../PasswordInput';
import { DEMO_ACCOUNT } from './demoAccount';
import { describeApiError, issuesToFieldErrors, type FieldErrors } from '../../../utils/formErrors';
import styles from './AuthForm.module.css';

interface AuthFormProps {
  mode: 'login' | 'register';
}

const EMPTY = { name: '', email: '', password: '', confirmPassword: '' };

/**
 * One form for both login and register.
 * - Validates with the SAME zod schemas the server uses (from @habit/shared),
 *   so the user sees mistakes instantly, and the server still double-checks.
 * - Server errors (wrong password, email taken…) are shown next to the right field
 *   or at the top of the form.
 * - On success nothing else is needed here: the user lands in the auth cache and the
 *   route guard (PublicOnlyRoute) sends them into the app.
 */
export function AuthForm({ mode }: AuthFormProps) {
  const { login, register } = useAuth();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    // Clear a field's error as soon as the user starts fixing it.
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function submit(input: typeof values) {
    setFormError(undefined);

    const parsed = isRegister
      ? registerSchema.safeParse({ name: input.name, email: input.email, password: input.password })
      : loginSchema.safeParse({ email: input.email, password: input.password });

    const fieldErrors = parsed.success ? {} : issuesToFieldErrors(parsed.error.issues);
    if (isRegister && input.confirmPassword !== input.password) {
      fieldErrors.confirmPassword = 'Passwords do not match';
    }
    if (!parsed.success || Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      if (isRegister) await register(registerSchema.parse(parsed.data));
      else await login(loginSchema.parse(parsed.data));
    } catch (err) {
      const described = describeApiError(err);
      setErrors(described.fieldErrors);
      setFormError(described.formError);
      setSubmitting(false);
    }
    // On success this component unmounts (redirect), so there is nothing to reset.
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit(values);
  }

  function handleDemoLogin() {
    const demo = { ...EMPTY, ...DEMO_ACCOUNT };
    setValues(demo);
    setErrors({});
    void submit(demo);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {formError && (
        <div className={styles.formError} role="alert">
          <Icon name="alert" size={18} />
          <span>{formError}</span>
        </div>
      )}

      {isRegister && (
        <Input
          label="Name"
          name="name"
          autoComplete="name"
          value={values.name}
          onChange={handleChange}
          error={errors.name}
          maxLength={LIMITS.USER_NAME_MAX}
          autoFocus
        />
      )}

      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        value={values.email}
        onChange={handleChange}
        error={errors.email}
        autoFocus={!isRegister}
      />

      <PasswordInput
        label="Password"
        name="password"
        autoComplete={isRegister ? 'new-password' : 'current-password'}
        value={values.password}
        onChange={handleChange}
        error={errors.password}
        hint={isRegister ? 'At least 8 characters, with a letter and a number.' : undefined}
      />

      {isRegister && (
        <PasswordInput
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />
      )}

      <Button type="submit" size="lg" fullWidth loading={submitting}>
        {isRegister ? 'Create account' : 'Log in'}
      </Button>

      {!isRegister && (
        <>
          <div className={styles.divider}>
            <span>or</span>
          </div>
          <Button variant="secondary" fullWidth onClick={handleDemoLogin} disabled={submitting}>
            Try the demo account
          </Button>
          <p className={styles.demoHint}>
            {DEMO_ACCOUNT.email} · created by <code>npm run seed</code>
          </p>
        </>
      )}
    </form>
  );
}
