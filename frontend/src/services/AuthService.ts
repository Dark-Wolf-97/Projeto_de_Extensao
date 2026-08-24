import { http } from './http';

export type Role = 'ADMIN' | 'SECRETARIA' | 'MEDICO';

export interface LoginResponse {
  user: {
    id: number;
    nome: string;
    email: string;
    role: Role;
  };
}

export const AuthService = {
  login: (email: string, senha: string) =>
    http<LoginResponse>('/auth/login', {
      method: 'POST',
      json: { email, senha },
    }),
  logout: (): Promise<void> =>
    http<void>('/auth/logout', {
      method: 'POST',
    }),
};
