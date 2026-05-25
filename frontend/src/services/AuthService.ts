import { http } from "./http";

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    role: "ADMIN" | "USER";
  };
}

export const AuthService = {
  login: (email: string, password: string) =>
    http<LoginResponse>("/auth/login", {
      method: "POST",
      json: { email, password },
    }),
};