import { http, safeRequest } from "./http";

export interface Usuario {
  id?: number | string;
  nome: string;
  email: string;
  perfil: "Administrador" | "Médico" | "Recepção";
  ativo: boolean;
}

const mockUsuarios: Usuario[] = [
  { id: 1, nome: "Dr. João Pereira", email: "joao@isg.com", perfil: "Médico", ativo: true },
  { id: 2, nome: "Dra. Marta Silva", email: "marta@isg.com", perfil: "Médico", ativo: true },
  { id: 3, nome: "Beatriz Costa", email: "bia@isg.com", perfil: "Recepção", ativo: true },
  { id: 4, nome: "Admin Sistema", email: "admin@isg.com", perfil: "Administrador", ativo: true },
];

export const UsuarioService = {
  listar: () => safeRequest(() => http<Usuario[]>("/usuarios"), mockUsuarios),
  criar: (usuario: Usuario) => http<void>("/usuarios", { method: "POST", json: usuario }),
  atualizar: (id: number | string, usuario: Usuario) =>
    http<void>(`/usuarios/${id}`, { method: "PUT", json: usuario }),
  deletar: (id: number | string) => http<void>(`/usuarios/${id}`, { method: "DELETE" }),
};
