import { http } from "./http";

export interface Paciente {
  id?: number;
  nome: string;
  cpf: string;
  telefone: string;
  dataNascimento?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConsultaDoPaciente {
  id: number;
  data: string;
  hora: string;
  status: string;
  observacoes?: string;
  medico: { id: number; nome: string; especialidade?: string };
  prontuario: { id: number } | null;
}

export interface PacientePerfil extends Paciente {
  consultas: ConsultaDoPaciente[];
}

export const PacienteService = {
  listar: (): Promise<Paciente[]> => http<Paciente[]>("/pacientes"),

  buscar: (nome: string): Promise<Paciente[]> =>
    http<Paciente[]>(`/pacientes/buscar?nome=${encodeURIComponent(nome)}`),

  buscarPerfil: (id: number): Promise<PacientePerfil> =>
    http<PacientePerfil>(`/pacientes/${id}`),

  criar: (paciente: Omit<Paciente, "id" | "createdAt" | "updatedAt">): Promise<Paciente> =>
    http<Paciente>("/pacientes", { method: "POST", json: paciente }),

  atualizar: (id: number, paciente: Partial<Omit<Paciente, "id" | "createdAt" | "updatedAt">>): Promise<Paciente> =>
    http<Paciente>(`/pacientes/${id}`, { method: "PUT", json: paciente }),

  deletar: (id: number): Promise<void> =>
    http<void>(`/pacientes/${id}`, { method: "DELETE" }),
};
