import { http } from "./http";

export interface Paciente {
  id?: number | string;
  nome: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  dataNascimento?: string;
}

export const PacienteService = {
  listar: async (): Promise<Paciente[]> => {
    return http<Paciente[]>("/pacientes");
  },

  buscar: async (nome: string): Promise<Paciente[]> => {
    return http<Paciente[]>(
      `/pacientes/buscar?nome=${encodeURIComponent(nome)}`
    );
  },

  criar: async (paciente: Paciente): Promise<void> => {
    await http<void>("/pacientes", {
      method: "POST",
      json: paciente,
    });
  },

  atualizar: async (
    id: number | string,
    paciente: Paciente
  ): Promise<void> => {
    await http<void>(`/pacientes/${id}`, {
      method: "PUT",
      json: paciente,
    });
  },

  deletar: async (id: number | string): Promise<void> => {
    await http<void>(`/pacientes/${id}`, {
      method: "DELETE",
    });
  },
};