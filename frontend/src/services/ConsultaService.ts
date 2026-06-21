import { http } from "./http";

export type StatusConsulta = "AGENDADA" | "CONFIRMADA" | "REALIZADA" | "CANCELADA";

export interface Consulta {
  id?: number;
  pacienteId: number;
  medicoId: number;
  paciente?: { id: number; nome: string; cpf: string; telefone?: string };
  medico?: { id: number; nome: string; crm?: string; especialidade?: string };
  prontuario?: { id: number } | null;
  data: string;
  hora: string;
  status: StatusConsulta;
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateConsultaPayload = {
  pacienteId: number;
  medicoId: number;
  data: string;
  hora: string;
  status?: StatusConsulta;
  observacoes?: string;
};

export const ConsultaService = {
  listar: (): Promise<Consulta[]> => http<Consulta[]>("/consultas"),

  buscarPorId: (id: number): Promise<Consulta> => http<Consulta>(`/consultas/${id}`),

  criar: (payload: CreateConsultaPayload): Promise<Consulta> =>
    http<Consulta>("/consultas", { method: "POST", json: payload }),

  atualizar: (id: number, payload: Partial<CreateConsultaPayload>): Promise<Consulta> =>
    http<Consulta>(`/consultas/${id}`, { method: "PUT", json: payload }),

  realizar: (id: number): Promise<Consulta> =>
    http<Consulta>(`/consultas/${id}/realizar`, { method: "PATCH" }),

  confirmar: (id: number): Promise<Consulta> =>
    http<Consulta>(`/consultas/${id}/confirmar`, { method: "PATCH" }),

  cancelar: (id: number): Promise<Consulta> =>
    http<Consulta>(`/consultas/${id}/cancelar`, { method: "PATCH" }),

  deletar: (id: number): Promise<void> =>
    http<void>(`/consultas/${id}`, { method: "DELETE" }),
};
