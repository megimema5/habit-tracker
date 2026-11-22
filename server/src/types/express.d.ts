/**
 * Adds `req.user` to Express's Request type.
 * It is set by the requireAuth middleware after the login cookie is verified.
 */
export interface AuthUser {
  id: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
