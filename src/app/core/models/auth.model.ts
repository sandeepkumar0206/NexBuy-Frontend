export type UserRole = 'USER' | 'ADMIN';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthUser {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
}
