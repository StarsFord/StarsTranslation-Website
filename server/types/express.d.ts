import { JWTPayload } from '../middleware/auth.js';

declare global {
  namespace Express {
    interface User extends JWTPayload {}
  }
}

export {};
