import { http, httpErrorMessage } from './http';

export interface Prontuario {
  id: number;
  consultaId: number;
  anamnese?: string;
  diagnostico?: string;
  prescricao?: string;
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
  consulta?: {
    id: number;
    data: string;
    hora: string;
    status: string;
    paciente?: { id: number; nome: string; cpf: string };
    medico?: { id: number; nome: string; especialidade?: string };
  };
}

export type CreateProntuarioPayload = {
  consultaId: number;
  anamnese?: string;
  diagnostico?: string;
  prescricao?: string;
  observacoes?: string;
};

export const ProntuarioService = {
  listar: (): Promise<Prontuario[]> => http<Prontuario[]>('/prontuarios'),

  buscarPorConsulta: async (consultaId: number): Promise<Prontuario | null> => {
    try {
      return await http<Prontuario>(`/prontuarios/consulta/${consultaId}`);
    } catch (err) {
      const { status } = httpErrorMessage(err);
      if (status === '404') return null;
      throw err;
    }
  },

  criar: (payload: CreateProntuarioPayload): Promise<Prontuario> =>
    http<Prontuario>('/prontuarios', { method: 'POST', json: payload }),

  atualizar: (id: number, payload: Partial<CreateProntuarioPayload>): Promise<Prontuario> =>
    http<Prontuario>(`/prontuarios/${id}`, { method: 'PUT', json: payload }),

  deletar: (id: number): Promise<void> =>
    http<void>(`/prontuarios/${id}`, { method: 'DELETE' }),
};
