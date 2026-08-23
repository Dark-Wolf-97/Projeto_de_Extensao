import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Consultas from './Consultas';
import { ConsultaService, type Consulta } from '@/services/ConsultaService';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/sonner';

vi.mock('@/services/ConsultaService', () => ({
  ConsultaService: {
    listar: vi.fn(),
    deletar: vi.fn(),
    recadastrarNaAgenda: vi.fn(),
    buscarLinkAgenda: vi.fn(),
  },
}));

vi.mock('@/components/ui/sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/components/modals/NovaConsultaModal', () => ({
  NovaConsultaModal: ({ open }: { open: boolean }) => (open ? <div data-testid="nova-consulta-modal" /> : null),
}));

vi.mock('@/components/modals/ProntuarioModal', () => ({
  ProntuarioModal: ({ open }: { open: boolean }) => (open ? <div data-testid="prontuario-modal" /> : null),
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
const mockRecadastrar = ConsultaService.recadastrarNaAgenda as ReturnType<typeof vi.fn>;
const mockBuscarLinkAgenda = ConsultaService.buscarLinkAgenda as ReturnType<typeof vi.fn>;
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
const mockToastSuccess = toast.success as ReturnType<typeof vi.fn>;
const mockToastError = toast.error as ReturnType<typeof vi.fn>;

const authAdmin = {
  user: { id: 1, nome: 'Admin', email: 'admin@clinica.com', role: 'ADMIN' },
  isAdmin: () => true,
  isSecretaria: () => false,
  isMedico: () => false,
};

const authMedico = {
  user: {
    id: 2,
    nome: 'Dr. Carlos',
    email: 'medico@clinica.com',
    role: 'MEDICO',
  },
  isAdmin: () => false,
  isSecretaria: () => false,
  isMedico: () => true,
};

const authSecretaria = {
  user: { id: 3, nome: 'Secretária', email: 'secretaria@clinica.com', role: 'SECRETARIA' },
  isAdmin: () => false,
  isSecretaria: () => true,
  isMedico: () => false,
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
    googleCalendarEventLink: 'https://calendar.google.com/event?eid=consulta-1',
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
  mockBuscarLinkAgenda.mockResolvedValue({
    link: 'https://calendar.google.com/calendar/u/0/r?cid=agenda',
  });
  mockRecadastrar.mockResolvedValue({
    ...consultasMock[0],
    googleCalendarEventId: 'evento-atualizado',
    googleCalendarEventLink: 'https://calendar.google.com/event?eid=atualizado',
  });
  mockUseAuth.mockReturnValue(authAdmin);
  vi.spyOn(window, 'open').mockImplementation(() => null);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

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

    await screen.findByText('Maria Silva');
    expect(screen.getByRole('button', { name: /nova consulta/i })).toBeInTheDocument();
  });

  it('ADMIN deve ver e abrir o botão geral do Google Agenda', async () => {
    render(<Consultas />);

    await screen.findByText('Maria Silva');
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Google Agenda' }));

    await waitFor(() => {
      expect(mockBuscarLinkAgenda).toHaveBeenCalledTimes(1);
      expect(window.open).toHaveBeenCalledWith(
        'https://calendar.google.com/calendar/u/0/r?cid=agenda',
        '_blank',
        'noopener,noreferrer',
      );
    });
  });

  it('deve mostrar loading ao buscar o link geral da agenda', async () => {
    let resolver: ((value: { link: string }) => void) | undefined;
    mockBuscarLinkAgenda.mockReturnValue(
      new Promise((resolve) => {
        resolver = resolve;
      }),
    );
    render(<Consultas />);

    await screen.findByText('Maria Silva');
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Google Agenda' }));

    expect(screen.getByRole('button', { name: 'Abrindo agenda...' })).toBeDisabled();
    resolver?.({ link: 'https://calendar.google.com/calendar' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Abrir Google Agenda' })).toBeEnabled());
  });

  it('ADMIN deve ver botões de editar e deletar em cada linha', async () => {
    render(<Consultas />);

    await waitFor(() => screen.getByText('Maria Silva'));

    const rows = screen.getAllByRole('row');
    expect(
      within(rows[1]).getByRole('button', {
        name: 'Editar consulta de Maria Silva',
      }),
    ).toBeInTheDocument();
    expect(
      within(rows[1]).getByRole('button', {
        name: 'Excluir consulta de Maria Silva',
      }),
    ).toBeInTheDocument();
  });

  it('ADMIN deve ter acesso às ações clínicas da consulta', async () => {
    render(<Consultas />);

    await screen.findByText('Maria Silva');

    expect(
      screen.getByRole('button', { name: 'Gerenciar prontuário de Maria Silva' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Marcar consulta de Maria Silva como realizada' }),
    ).toBeInTheDocument();
  });

  it('deve revelar no hover a mesma legenda usada no tooltip das ações de ADMIN', async () => {
    render(<Consultas />);

    await screen.findByText('Maria Silva');
    const row = screen.getAllByRole('row')[1];
    const labels = [
      'Ver / criar prontuário',
      'Marcar como Realizada',
      'Abrir card',
      'Re-cadastrar na agenda',
      'Editar consulta',
      'Excluir consulta',
      'Marcar como Confirmada',
      'Cancelar Consulta',
    ];

    for (const label of labels) {
      const button = within(row).getByTitle(label);
      expect(button).toHaveClass('group', 'hover:w-64');
      expect(within(button).getByText(label)).toBeInTheDocument();
    }
  });

  it('deve aplicar o mesmo padrão à ação de WhatsApp da SECRETARIA', async () => {
    mockUseAuth.mockReturnValue(authSecretaria);
    render(<Consultas />);

    await screen.findByText('Maria Silva');
    const primeiraLinha = screen.getAllByRole('row')[1];
    const button = within(primeiraLinha).getByTitle('Enviar confirmação via WhatsApp');

    expect(button).toHaveClass('group', 'hover:w-64');
    expect(within(button).getByText('Enviar confirmação via WhatsApp')).toBeInTheDocument();
  });

  it('deve aplicar o mesmo padrão às ações do MEDICO', async () => {
    mockUseAuth.mockReturnValue(authMedico);
    render(<Consultas />);

    await screen.findByText('Maria Silva');
    const primeiraLinha = screen.getAllByRole('row')[1];

    for (const label of ['Ver / criar prontuário', 'Marcar como Realizada']) {
      const button = within(primeiraLinha).getByTitle(label);
      expect(button).toHaveClass('group', 'hover:w-64');
      expect(within(button).getByText(label)).toBeInTheDocument();
    }
  });

  it('deve abrir o card da agenda quando a consulta tem link', async () => {
    render(<Consultas />);

    await screen.findByText('Maria Silva');
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Abrir card da agenda de Maria Silva',
      }),
    );

    expect(window.open).toHaveBeenCalledWith(
      'https://calendar.google.com/event?eid=consulta-1',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('deve re-cadastrar na agenda com loading e toast de sucesso', async () => {
    let resolver: ((value: Consulta) => void) | undefined;
    mockRecadastrar.mockReturnValue(
      new Promise((resolve) => {
        resolver = resolve;
      }),
    );
    render(<Consultas />);

    await screen.findByText('Maria Silva');
    const rows = screen.getAllByRole('row');
    fireEvent.click(within(rows[1]).getByRole('button', { name: 'Re-cadastrar na agenda' }));

    expect(mockRecadastrar).toHaveBeenCalledWith(1);
    expect(within(rows[1]).getByRole('button', { name: 'Cadastrando...' })).toBeDisabled();

    resolver?.({
      ...consultasMock[0],
      googleCalendarEventLink: 'https://calendar.google.com/event?eid=novo',
    });
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Consulta cadastrada no Google Agenda!');
    });
  });

  it('deve mostrar erro amigável ao falhar o re-cadastro na agenda', async () => {
    mockRecadastrar.mockRejectedValue(new Error('502:Google Agenda temporariamente indisponível.'));
    render(<Consultas />);

    await screen.findByText('Maria Silva');
    const rows = screen.getAllByRole('row');
    fireEvent.click(within(rows[1]).getByRole('button', { name: 'Re-cadastrar na agenda' }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Google Agenda temporariamente indisponível.');
    });
  });

  it('MEDICO não deve ver o botão "Nova Consulta"', async () => {
    mockUseAuth.mockReturnValue(authMedico);

    render(<Consultas />);

    await screen.findByText('Maria Silva');
    expect(screen.queryByRole('button', { name: /nova consulta/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /google agenda/i })).not.toBeInTheDocument();
  });

  it('MEDICO não deve ver colunas de ações', async () => {
    mockUseAuth.mockReturnValue(authMedico);

    render(<Consultas />);

    await waitFor(() => screen.getByText('Maria Silva'));

    expect(screen.queryByRole('columnheader', { name: /ações/i })).not.toBeInTheDocument();
  });

  it('deve abrir o modal ao clicar em "Nova Consulta"', async () => {
    render(<Consultas />);

    await screen.findByText('Maria Silva');
    fireEvent.click(screen.getByRole('button', { name: /nova consulta/i }));

    expect(screen.getByTestId('nova-consulta-modal')).toBeInTheDocument();
  });

  it('deve chamar deletar com id correto ao confirmar exclusão', async () => {
    render(<Consultas />);

    await waitFor(() => screen.getByText('Maria Silva'));

    fireEvent.click(screen.getByRole('button', { name: 'Excluir consulta de Maria Silva' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remover' }));

    await waitFor(() => {
      expect(mockDeletar).toHaveBeenCalledWith(1);
    });
  });

  it('não deve deletar quando o usuário cancela a confirmação', async () => {
    render(<Consultas />);

    await waitFor(() => screen.getByText('Maria Silva'));

    fireEvent.click(screen.getByRole('button', { name: 'Excluir consulta de Maria Silva' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(mockDeletar).not.toHaveBeenCalled();
  });

  it('deve navegar para o perfil do paciente ao clicar no nome', async () => {
    render(<Consultas />);

    await waitFor(() => screen.getByText('Maria Silva'));

    fireEvent.click(screen.getByText('Maria Silva'));

    expect(mockNavigate).toHaveBeenCalledWith('/pacientes/10');
  });
});
