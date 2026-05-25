import { http } from "./http";

export interface Consulta {
  id?: number | string;
  pacienteId?: number | string;
  pacienteNome?: string;
  data: string; // yyyy-mm-dd
  hora: string; // HH:mm
  medico: string;
  observacoes?: string;
  status?: "Agendada" | "Confirmada" | "Realizada" | "Cancelada";
}

export const ConsultaService = {
  listar: async (): Promise<Consulta[]> => {
    return http<Consulta[]>("/consultas");
  },

  criar: async (consulta: Consulta): Promise<void> => {
    await http<void>("/consultas", {
      method: "POST",
      json: consulta,
    });
  },

  atualizar: async (
    id: number | string,
    consulta: Consulta
  ): Promise<void> => {
    await http<void>(`/consultas/${id}`, {
      method: "PUT",
      json: consulta,
    });
  },

  deletar: async (id: number | string): Promise<void> => {
    await http<void>(`/consultas/${id}`, {
      method: "DELETE",
    });
  },
};