import { User as DbUser } from './database';

declare global {
  namespace Express {
    interface User extends DbUser {}
  }
}

export {};
