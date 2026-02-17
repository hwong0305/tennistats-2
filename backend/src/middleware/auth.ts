import passport from 'passport';
import type { Request } from 'express';
import type { JWTPayload } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export const authenticateToken = passport.authenticate('jwt', { session: false });

export { JWT_SECRET };
