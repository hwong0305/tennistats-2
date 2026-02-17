import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, type StrategyOptions } from 'passport-jwt';
import type { JWTPayload } from '../types/index.js';
import { JWT_SECRET } from '../middleware/auth.js';

const cookieExtractor = (req: { cookies?: Record<string, string> } | undefined): string | null => {
  if (!req || !req.cookies) return null;
  return req.cookies.access_token || null;
};

export const configurePassport = (): void => {
  const options: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromExtractors([
      ExtractJwt.fromAuthHeaderAsBearerToken(),
      cookieExtractor,
    ]),
    secretOrKey: JWT_SECRET,
  };

  passport.use(
    new JwtStrategy(options, (payload: JWTPayload, done) => {
      if (!payload || !payload.userId) {
        return done(null, false);
      }
      return done(null, payload);
    })
  );
};

export default passport;
