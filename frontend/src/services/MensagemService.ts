import { http } from "./http";

export type TipoMensagem = "CONFIRMACAO" | "LEMBRETE" | "ANIVERSARIO";
export type StatusMensagem = "PENDENTE" | "ENVIADA" | "CANCELADA" | "FALHA";

export interface Mensagem {
  id: number;
  tipo: TipoMensagem;
  status: StatusMensagem;
  pacienteId: number;
  paciente?: { id: number; nome: string; telefone: string };
  consultaId?: number | null;
  consulta?: { id: number; data: string; hora: string } | null;
  telefone: string;
  conteudo: string;
  agendadoPara: string;
  enviadoEm?: string | null;
  canceladoEm?: string | null;
  erro?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const MensagemService = {
  listarPendentes: (): Promise<Mensagem[]> => http<Mensagem[]>("/mensagens/pendentes"),

  listarHistorico: (): Promise<Mensagem[]> => http<Mensagem[]>("/mensagens/historico"),

  editar: (id: number, conteudo: string): Promise<Mensagem> =>
    http<Mensagem>(`/mensagens/${id}`, { method: "PATCH", json: { conteudo } }),

  cancelar: (id: number): Promise<Mensagem> =>
    http<Mensagem>(`/mensagens/${id}/cancelar`, { method: "PATCH" }),

  enviarAgora: (id: number): Promise<Mensagem> =>
    http<Mensagem>(`/mensagens/${id}/enviar-agora`, { method: "PATCH" }),
};
