import { http, safeRequest } from "./http";

export interface Mensagem {
  id?: number | string;
  destinatario: string;
  pacienteId?: number | string;
  assunto: string;
  conteudo: string;
  canal: "WhatsApp" | "Email" | "SMS";
  status: "A Validar" | "Enviada" | "Erro";
  criadaEm: string; // ISO
  enviadaEm?: string;
}

const agora = new Date().toISOString();
const mockMensagens: Mensagem[] = [
  { id: 1, destinatario: "Ana Souza", assunto: "Confirmação de consulta", conteudo: "Olá Ana, sua consulta está agendada para amanhã.", canal: "WhatsApp", status: "A Validar", criadaEm: agora },
  { id: 2, destinatario: "Bruno Lima", assunto: "Lembrete de exame", conteudo: "Não esqueça do seu exame na próxima semana.", canal: "Email", status: "A Validar", criadaEm: agora },
  { id: 3, destinatario: "Carla Mendes", assunto: "Resultado disponível", conteudo: "Seu resultado já está disponível.", canal: "Email", status: "Enviada", criadaEm: agora, enviadaEm: agora },
  { id: 4, destinatario: "Diego Rocha", assunto: "Boas-vindas", conteudo: "Bem-vindo ao Portal ISG!", canal: "SMS", status: "Enviada", criadaEm: agora, enviadaEm: agora },
];

export const MensagemService = {
  listar: () => safeRequest(() => http<Mensagem[]>("/mensagens"), mockMensagens),
  listarAValidar: () =>
    safeRequest(
      () => http<Mensagem[]>("/mensagens?status=a-validar"),
      mockMensagens.filter((m) => m.status === "A Validar"),
    ),
  listarEnviadas: () =>
    safeRequest(
      () => http<Mensagem[]>("/mensagens?status=enviadas"),
      mockMensagens.filter((m) => m.status === "Enviada"),
    ),
  validar: (id: number | string) =>
    http<void>(`/mensagens/${id}/validar`, { method: "POST" }),
  deletar: (id: number | string) => http<void>(`/mensagens/${id}`, { method: "DELETE" }),
};
