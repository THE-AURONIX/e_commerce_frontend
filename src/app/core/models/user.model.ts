export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin' | 'vendor';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}
