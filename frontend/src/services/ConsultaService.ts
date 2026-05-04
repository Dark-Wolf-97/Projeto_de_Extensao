import { http, safeRequest } from "./http";

export interface Consulta {
  id?: number | string;
  pacienteId?: number | string;
  pacienteNome?: string;
  data: string; // ISO ou yyyy-mm-dd
  hora: string; // HH:mm
  medico?: string;
  observacoes?: string;
  status?: "Agendada" | "Confirmada" | "Realizada" | "Cancelada";
}

const hoje = new Date().toISOString().slice(0, 10);
const mockConsultas: Consulta[] = [
  { id: 1, pacienteId: 1, pacienteNome: "Ana Souza", data: hoje, hora: "08:30", medico: "Dr. João", status: "Confirmada" },
  { id: 2, pacienteId: 2, pacienteNome: "Bruno Lima", data: hoje, hora: "09:15", medico: "Dra. Marta", status: "Agendada" },
  { id: 3, pacienteId: 3, pacienteNome: "Carla Mendes", data: hoje, hora: "10:00", medico: "Dr. João", status: "Agendada" },
  { id: 4, pacienteId: 1, pacienteNome: "Ana Souza", data: hoje, hora: "11:30", medico: "Dra. Marta", status: "Confirmada" },
];

export const ConsultaService = {
  listar: () => safeRequest(() => http<Consulta[]>("/consultas"), mockConsultas),
  criar: (consulta: Consulta) => http<void>("/consultas", { method: "POST", json: consulta }),
  atualizar: (id: number | string, consulta: Consulta) =>
    http<void>(`/consultas/${id}`, { method: "PUT", json: consulta }),
  deletar: (id: number | string) => http<void>(`/consultas/${id}`, { method: "DELETE" }),
};
