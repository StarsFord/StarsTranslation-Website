import { JWTPayload } from '../middleware/auth.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: JWTPayload | null;
  }
}

export {};
