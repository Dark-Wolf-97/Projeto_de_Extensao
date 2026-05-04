import { http, safeRequest } from "./http";

export interface Paciente {
  id?: number | string;
  nome: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  dataNascimento?: string;
}

const mockPacientes: Paciente[] = [
  { id: 1, nome: "Ana Souza", cpf: "123.456.789-00", telefone: "(11) 99999-1111", email: "ana@email.com", dataNascimento: "1990-05-12" },
  { id: 2, nome: "Bruno Lima", cpf: "987.654.321-00", telefone: "(11) 98888-2222", email: "bruno@email.com", dataNascimento: "1985-09-03" },
  { id: 3, nome: "Carla Mendes", cpf: "111.222.333-44", telefone: "(11) 97777-3333", email: "carla@email.com", dataNascimento: "1992-12-22" },
];

export const PacienteService = {
  listar: () => safeRequest(() => http<Paciente[]>("/pacientes"), mockPacientes),
  buscar: (nome: string) =>
    safeRequest(
      () => http<Paciente[]>(`/pacientes/buscar?nome=${encodeURIComponent(nome)}`),
      mockPacientes.filter((p) => p.nome.toLowerCase().includes(nome.toLowerCase())),
    ),
  criar: (paciente: Paciente) => http<void>("/pacientes", { method: "POST", json: paciente }),
  atualizar: (id: number | string, paciente: Paciente) =>
    http<void>(`/pacientes/${id}`, { method: "PUT", json: paciente }),
  deletar: (id: number | string) => http<void>(`/pacientes/${id}`, { method: "DELETE" }),
};
