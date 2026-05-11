export interface AuthResponse {
  token: string;
  userId: number;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface CurrentUser {
  userId: number;
  email: string;
}
