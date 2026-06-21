import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Consultas from './Consultas';
import { ConsultaService } from '@/services/ConsultaService';
import { useAuth } from '@/context/AuthContext';

vi.mock('@/services/ConsultaService', () => ({
  ConsultaService: {
    listar: vi.fn(),
    deletar: vi.fn(),
  },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/components/modals/NovaConsultaModal', () => ({
  NovaConsultaModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="nova-consulta-modal" /> : null,
}));

vi.mock('@/components/modals/ProntuarioModal', () => ({
  ProntuarioModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="prontuario-modal" /> : null,
}));

vi.mock('@/components/layout/PageShell', () => ({
  PageShell: ({ children, actions }: { children: React.ReactNode; actions?: React.ReactNode }) => (
    <div>
      <div data-testid="page-actions">{actions}</div>
      {children}
    </div>
  ),
}));

const mockNavigate = vi.fn();
const mockListar = ConsultaService.listar as ReturnType<typeof vi.fn>;
const mockDeletar = ConsultaService.deletar as ReturnType<typeof vi.fn>;
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
const confirmSpy = vi.spyOn(window, 'confirm');

const authAdmin = {
  user: { id: 1, nome: 'Admin', email: 'admin@clinica.com', role: 'ADMIN' },
  isAdmin: () => true,
  isSecretaria: () => false,
  isMedico: () => false,
};

const authMedico = {
  user: { id: 2, nome: 'Dr. Carlos', email: 'medico@clinica.com', role: 'MEDICO' },
  isAdmin: () => false,
  isSecretaria: () => false,
  isMedico: () => true,
};

const consultasMock = [
  {
    id: 1,
    pacienteId: 10,
    medicoId: 2,
    paciente: { id: 10, nome: 'Maria Silva', cpf: '123.456.789-00' },
    medico: { id: 2, nome: 'Dr. Carlos', especialidade: 'Clínica Geral' },
    data: '2027-06-15T00:00:00.000Z',
    hora: '10:00',
    status: 'AGENDADA' as const,
  },
  {
    id: 2,
    pacienteId: 11,
    medicoId: 2,
    paciente: { id: 11, nome: 'João Costa', cpf: '987.654.321-00' },
    medico: { id: 2, nome: 'Dr. Carlos', especialidade: 'Clínica Geral' },
    data: '2027-07-20T00:00:00.000Z',
    hora: '14:00',
    status: 'CONFIRMADA' as const,
  },
];

beforeEach(() => {
  mockListar.mockResolvedValue(consultasMock);
  mockDeletar.mockResolvedValue(undefined);
  confirmSpy.mockReturnValue(true);
  mockUseAuth.mockReturnValue(authAdmin);
});

afterEach(() => vi.clearAllMocks());

describe('Consultas', () => {
  it('deve exibir as consultas carregadas', async () => {
    render(<Consultas />);

    await waitFor(() => {
      expect(screen.getByText('Maria Silva')).toBeInTheDocument();
      expect(screen.getByText('João Costa')).toBeInTheDocument();
    });
  });

  it('deve exibir estado vazio quando não há consultas', async () => {
    mockListar.mockResolvedValue([]);

    render(<Consultas />);

    await waitFor(() => {
      expect(screen.getByText('Nenhuma consulta encontrada')).toBeInTheDocument();
    });
  });

  it('deve exibir badges de status coloridos', async () => {
    render(<Consultas />);

    await waitFor(() => {
      expect(screen.getByText('Agendada')).toBeInTheDocument();
      expect(screen.getByText('Confirmada')).toBeInTheDocument();
    });
  });

  it('deve exibir a especialidade do médico abaixo do nome', async () => {
    render(<Consultas />);

    await waitFor(() => {
      expect(screen.getAllByText('Clínica Geral')).toHaveLength(2);
    });
  });

  it('ADMIN deve ver o botão "Nova Consulta"', async () => {
    render(<Consultas />);

    expect(screen.getByRole('button', { name: /nova consulta/i })).toBeInTheDocument();
  });

  it('ADMIN deve ver botões de editar e deletar em cada linha', async () => {
    render(<Consultas />);

    await waitFor(() => screen.getByText('Maria Silva'));

    const rows = screen.getAllByRole('row');
    // 3 botões: nome do paciente (button), editar, deletar
    const botoesLinha1 = within(rows[1]).getAllByRole('button');
    expect(botoesLinha1).toHaveLength(3);
  });

  it('MEDICO não deve ver o botão "Nova Consulta"', async () => {
    mockUseAuth.mockReturnValue(authMedico);

    render(<Consultas />);

    expect(screen.queryByRole('button', { name: /nova consulta/i })).not.toBeInTheDocument();
  });

  it('MEDICO não deve ver colunas de ações', async () => {
    mockUseAuth.mockReturnValue(authMedico);

    render(<Consultas />);

    await waitFor(() => screen.getByText('Maria Silva'));

    expect(screen.queryByRole('columnheader', { name: /ações/i })).not.toBeInTheDocument();
  });

  it('deve abrir o modal ao clicar em "Nova Consulta"', async () => {
    render(<Consultas />);

    fireEvent.click(screen.getByRole('button', { name: /nova consulta/i }));

    expect(screen.getByTestId('nova-consulta-modal')).toBeInTheDocument();
  });

  it('deve chamar deletar com id correto ao confirmar exclusão', async () => {
    render(<Consultas />);

    await waitFor(() => screen.getByText('Maria Silva'));

    const rows = screen.getAllByRole('row');
    // botoes[0]=nome paciente, botoes[1]=editar, botoes[2]=deletar
    const botoes = within(rows[1]).getAllByRole('button');
    fireEvent.click(botoes[2]);

    await waitFor(() => {
      expect(mockDeletar).toHaveBeenCalledWith(1);
    });
  });

  it('não deve deletar quando o usuário cancela a confirmação', async () => {
    confirmSpy.mockReturnValue(false);

    render(<Consultas />);

    await waitFor(() => screen.getByText('Maria Silva'));

    const rows = screen.getAllByRole('row');
    const botoes = within(rows[1]).getAllByRole('button');
    fireEvent.click(botoes[2]);

    expect(mockDeletar).not.toHaveBeenCalled();
  });

  it('deve navegar para o perfil do paciente ao clicar no nome', async () => {
    render(<Consultas />);

    await waitFor(() => screen.getByText('Maria Silva'));

    fireEvent.click(screen.getByText('Maria Silva'));

    expect(mockNavigate).toHaveBeenCalledWith('/pacientes/10');
  });
});
