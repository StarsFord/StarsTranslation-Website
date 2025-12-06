declare module 'passport-patreon' {
  import { Strategy as PassportStrategy } from 'passport-strategy';
  import { Request } from 'express';

  export interface Profile {
    id: string;
    username?: string;
    displayName?: string;
    emails?: Array<{ value: string }>;
    photos?: Array<{ value: string }>;
    provider: 'patreon';
    _raw: string;
    _json: any;
  }

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
    state?: boolean;
  }

  export type VerifyCallback = (error: any, user?: any, info?: any) => void;

  export type VerifyFunction = (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback
  ) => void | Promise<void>;

  export class Strategy extends PassportStrategy {
    constructor(options: StrategyOptions, verify: VerifyFunction);
    name: string;
    authenticate(req: Request, options?: any): void;
  }
}
