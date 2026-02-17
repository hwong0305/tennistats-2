import type { JWTPayload } from './index.js';

declare global {
  namespace Express {
    interface User extends JWTPayload {}
  }
}

export {};
