import { User } from './user.types';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  tokens: AuthTokens;
  user: Omit<User, 'createdAt' | 'updatedAt' | 'isEmailVerified'>;
}

export interface LoginResponse {
  success: boolean;
  data: AuthResponse;
}
