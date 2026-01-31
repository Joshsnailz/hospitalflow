import { UserRole } from './user.types';

export interface JwtAccessPayload {
  sub: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface JwtRefreshPayload {
  sub: string;
  jti: string;
  iat: number;
  exp: number;
}
