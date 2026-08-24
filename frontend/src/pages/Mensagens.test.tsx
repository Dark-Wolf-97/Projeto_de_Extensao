import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import Mensagens from './Mensagens';
import { MensagemService } from '@/services/MensagemService';

const navigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}));

vi.mock('@/services/MensagemService', () => ({
  MensagemService: {
    listarPendentes: vi.fn(),
    listarHistorico: vi.fn(),
    editar: vi.fn(),
    cancelar: vi.fn(),
    enviarAgora: vi.fn(),
  },
}));

const mockListarPendentes = MensagemService.listarPendentes as ReturnType<typeof vi.fn>;
const mockListarHistorico = MensagemService.listarHistorico as ReturnType<typeof vi.fn>;
const mockEditar = MensagemService.editar as ReturnType<typeof vi.fn>;
const mockCancelar = MensagemService.cancelar as ReturnType<typeof vi.fn>;
const mockEnviarAgora = MensagemService.enviarAgora as ReturnType<typeof vi.fn>;

const mensagemPendente = {
  id: 5,
  tipo: 'CONFIRMACAO' as const,
  status: 'PENDENTE' as const,
  pacienteId: 1,
  paciente: { id: 1, nome: 'Maria Silva', telefone: '(42) 99999-0000' },
  consultaId: 10,
  telefone: '(42) 99999-0000',
  conteudo: 'Olá, Maria! Sua consulta está agendada.',
  agendadoPara: '2027-01-15T10:00:00.000Z',
  createdAt: '2027-01-14T10:00:00.000Z',
  updatedAt: '2027-01-14T10:00:00.000Z',
};

const mensagemHistorico = {
  id: 6,
  tipo: 'LEMBRETE' as const,
  status: 'ENVIADA' as const,
  pacienteId: 2,
  paciente: { id: 2, nome: 'João Souza', telefone: '(42) 98888-0000' },
  consultaId: 11,
  telefone: '(42) 98888-0000',
  conteudo: 'Olá, João! Lembrete da sua consulta amanhã.',
  agendadoPara: '2027-01-14T08:00:00.000Z',
  enviadoEm: '2027-01-14T08:00:05.000Z',
  createdAt: '2027-01-14T08:00:00.000Z',
  updatedAt: '2027-01-14T08:00:05.000Z',
};

beforeEach(() => {
  mockListarPendentes.mockResolvedValue([mensagemPendente]);
  mockListarHistorico.mockResolvedValue([mensagemHistorico]);
  mockEditar.mockResolvedValue({ ...mensagemPendente, conteudo: 'novo texto' });
  mockCancelar.mockResolvedValue({ ...mensagemPendente, status: 'CANCELADA' });
  mockEnviarAgora.mockResolvedValue({ ...mensagemPendente, status: 'ENVIADA' });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Mensagens', () => {
  it('oferece um botão para retornar à tela anterior', () => {
    render(<Mensagens />);

    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));

    expect(navigate).toHaveBeenCalledWith(-1);
  });

  it('deve listar as mensagens pendentes carregadas', async () => {
    render(<Mensagens />);

    await waitFor(() => {
      expect(screen.getByText('Maria Silva')).toBeInTheDocument();
      expect(screen.getByText('Confirmação')).toBeInTheDocument();
    });
  });

  it('deve listar o histórico na aba correspondente', async () => {
    render(<Mensagens />);

    // O TabsTrigger do Radix seleciona a aba no onMouseDown, não no click.
    fireEvent.mouseDown(screen.getByRole('tab', { name: /histórico/i }));

    await waitFor(() => {
      expect(screen.getByText('João Souza')).toBeInTheDocument();
      expect(screen.getByText('Enviada')).toBeInTheDocument();
    });
  });

  it('deve cancelar uma mensagem pendente após confirmar', async () => {
    render(<Mensagens />);
    await screen.findByText('Maria Silva');

    fireEvent.click(
      screen.getByRole('button', { name: 'Cancelar mensagem de Maria Silva' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar mensagem' }));

    await waitFor(() => {
      expect(mockCancelar).toHaveBeenCalledWith(5);
    });
  });

  it('deve enviar uma mensagem pendente imediatamente após confirmar', async () => {
    render(<Mensagens />);
    await screen.findByText('Maria Silva');

    fireEvent.click(
      screen.getByRole('button', { name: 'Enviar agora mensagem de Maria Silva' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Enviar agora' }));

    await waitFor(() => {
      expect(mockEnviarAgora).toHaveBeenCalledWith(5);
    });
  });

  it('deve editar o conteúdo de uma mensagem pendente', async () => {
    render(<Mensagens />);
    await screen.findByText('Maria Silva');

    fireEvent.click(
      screen.getByRole('button', { name: 'Editar mensagem de Maria Silva' }),
    );

    const textarea = await screen.findByDisplayValue(mensagemPendente.conteudo);
    fireEvent.change(textarea, { target: { value: 'novo texto' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(mockEditar).toHaveBeenCalledWith(5, 'novo texto');
    });
  });
});
