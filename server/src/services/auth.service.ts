import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { LoginInput, RegisterInput, User } from '@habit/shared';
import { env } from '../config/env.js';
import { usersRepository } from '../repositories/users.repository.js';
import { HttpError } from '../utils/HttpError.js';

/**
 * Authentication business logic: password hashing, register, login and JWTs.
 * Controllers call these functions; they never touch bcrypt or jwt directly.
 */

const INVALID_CREDENTIALS = 'Invalid email or password';

/**
 * A real bcrypt hash of a random value, used when the email doesn't exist.
 * Comparing against it makes "unknown email" take as long as "wrong password",
 * so attackers can't discover registered emails by timing the response.
 */
let dummyHash: string | undefined;
function getDummyHash(): string {
  dummyHash ??= bcrypt.hashSync('dummy-password-for-timing', env.BCRYPT_ROUNDS);
  return dummyHash;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.BCRYPT_ROUNDS);
}

/** SQLite result code for "UNIQUE constraint failed". */
const SQLITE_CONSTRAINT_UNIQUE = 2067;

function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Error && 'errcode' in err && err.errcode === SQLITE_CONSTRAINT_UNIQUE;
}

export async function register(input: RegisterInput): Promise<User> {
  if (usersRepository.emailExists(input.email)) {
    throw HttpError.conflict('Email already in use');
  }

  const passwordHash = await hashPassword(input.password);

  try {
    return usersRepository.create({ name: input.name, email: input.email, passwordHash });
  } catch (err) {
    // Two sign-ups with the same email at the same moment: the UNIQUE constraint catches it.
    if (isUniqueConstraintError(err)) throw HttpError.conflict('Email already in use');
    throw err;
  }
}

export async function login(input: LoginInput): Promise<User> {
  const found = usersRepository.findByEmailWithPassword(input.email);

  // Always run bcrypt, even if the user doesn't exist (see getDummyHash).
  const passwordMatches = await bcrypt.compare(
    input.password,
    found?.passwordHash ?? getDummyHash(),
  );

  if (!found || !passwordMatches) {
    // Same message for both cases → doesn't reveal which emails are registered.
    throw HttpError.unauthorized(INVALID_CREDENTIALS);
  }

  return found.user;
}

/** Creates a signed login token. The payload only holds the user id (`sub`) — nothing sensitive. */
export function signToken(userId: number): string {
  return jwt.sign({}, env.JWT_SECRET, {
    subject: String(userId),
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

/**
 * Checks a token's signature and expiry. Returns the user id, or null if the token
 * is missing, tampered with, expired or signed with a different algorithm.
 */
export function verifyToken(token: string): number | null {
  try {
    // Pinning the algorithm blocks "alg: none" and algorithm-switching attacks.
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof payload === 'string' || !payload.sub) return null;

    const userId = Number(payload.sub);
    return Number.isInteger(userId) && userId > 0 ? userId : null;
  } catch {
    return null;
  }
}
