import { http } from "./http";

export type Role = "ADMIN" | "USER";

export interface Usuario {
  id?: number | string;
  name?: string;
  email: string;
  password?: string;
  role: Role;
  active?: boolean;
}

export const UsuarioService = {
  listar: async (): Promise<Usuario[]> => {
    return http<Usuario[]>("/users");
  },

  criar: async (usuario: Usuario): Promise<void> => {
    await http<void>("/users", {
      method: "POST",
      json: usuario,
    });
  },

  atualizar: async (
    id: number | string,
    usuario: Partial<Usuario>
  ): Promise<void> => {
    await http<void>(`/users/${id}`, {
      method: "PUT",
      json: usuario,
    });
  },

  deletar: async (id: number | string): Promise<void> => {
    await http<void>(`/users/${id}`, {
      method: "DELETE",
    });
  },
};