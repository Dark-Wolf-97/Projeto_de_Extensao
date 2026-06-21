import { http } from "./http";

export type Role = "ADMIN" | "SECRETARIA" | "MEDICO";

export interface Usuario {
  id?: number;
  nome: string;
  email: string;
  senha?: string;
  role: Role;
  crm?: string;
  especialidade?: string;
  telefone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MedicoResumo {
  id: number;
  nome: string;
  crm?: string;
  especialidade?: string;
}

export const UsuarioService = {
  listar: (): Promise<Usuario[]> => http<Usuario[]>("/users"),

  listarMedicos: (): Promise<MedicoResumo[]> => http<MedicoResumo[]>("/users/medicos"),

  buscarPorNome: (nome: string): Promise<Usuario[]> =>
    http<Usuario[]>(`/users/buscar?nome=${encodeURIComponent(nome)}`),

  buscarPorId: (id: number): Promise<Usuario> => http<Usuario>(`/users/${id}`),

  criar: (usuario: Omit<Usuario, "id" | "createdAt" | "updatedAt">): Promise<Usuario> =>
    http<Usuario>("/users", { method: "POST", json: usuario }),

  atualizar: (id: number, usuario: Partial<Omit<Usuario, "id" | "createdAt" | "updatedAt">>): Promise<Usuario> =>
    http<Usuario>(`/users/${id}`, { method: "PUT", json: usuario }),

  deletar: (id: number): Promise<void> =>
    http<void>(`/users/${id}`, { method: "DELETE" }),

  me: (): Promise<Usuario> => http<Usuario>("/users/me"),

  atualizarMe: (
    data: Partial<Omit<Usuario, "id" | "role" | "createdAt" | "updatedAt">>
  ): Promise<Usuario> => http<Usuario>("/users/me", { method: "PUT", json: data }),
};
