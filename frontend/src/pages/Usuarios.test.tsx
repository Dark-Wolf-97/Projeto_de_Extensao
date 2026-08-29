import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Usuarios from './Usuarios';
import { UsuarioService } from '@/services/UsuarioService';
import { toast } from '@/components/ui/sonner';

vi.mock('@/services/UsuarioService', () => ({
  UsuarioService: {
    listar: vi.fn(),
    deletar: vi.fn(),
    contarConsultasVinculadas: vi.fn(),
  },
}));

vi.mock('@/components/ui/sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/modals/UsuarioModal', () => ({
  UsuarioModal: ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) =>
    open ? (
      <div data-testid="usuario-modal">
        <button onClick={() => onOpenChange(false)}>Fechar</button>
      </div>
    ) : null,
}));

vi.mock('@/components/layout/PageShell', () => ({
  PageShell: ({ children, actions }: { children: React.ReactNode; actions?: React.ReactNode }) => (
    <div>
      <div data-testid="page-actions">{actions}</div>
      {children}
    </div>
  ),
}));

const mockListar = UsuarioService.listar as ReturnType<typeof vi.fn>;
const mockDeletar = UsuarioService.deletar as ReturnType<typeof vi.fn>;
const mockContarConsultasVinculadas =
  UsuarioService.contarConsultasVinculadas as ReturnType<typeof vi.fn>;

const usuariosMock = [
  {
    id: 1,
    nome: 'Ana Santos',
    email: 'admin@clinica.com',
    role: 'ADMIN' as const,
    telefone: '(11) 99999-0000',
  },
  {
    id: 2,
    nome: 'Dr. Carlos',
    email: 'medico@clinica.com',
    role: 'MEDICO' as const,
    telefone: undefined,
  },
];

beforeEach(() => {
  mockListar.mockResolvedValue(usuariosMock);
  mockDeletar.mockResolvedValue(undefined);
  mockContarConsultasVinculadas.mockResolvedValue({ total: 0, ativas: 0 });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Usuarios', () => {
  it('deve exibir os usuários carregados pelo e-mail', async () => {
    render(<Usuarios />);

    await waitFor(() => {
      expect(screen.getByText('admin@clinica.com')).toBeInTheDocument();
      expect(screen.getByText('medico@clinica.com')).toBeInTheDocument();
    });
  });

  it('deve exibir os nomes dos usuários nas células da tabela', async () => {
    render(<Usuarios />);

    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      expect(within(rows[1]).getByText('Ana Santos')).toBeInTheDocument();
      expect(within(rows[2]).getByText('Dr. Carlos')).toBeInTheDocument();
    });
  });

  it('deve exibir mensagem quando não há usuários', async () => {
    mockListar.mockResolvedValue([]);

    render(<Usuarios />);

    await waitFor(() => {
      expect(screen.getByText('Nenhum usuário encontrado')).toBeInTheDocument();
    });
  });

  it('deve exibir badge do perfil Médico', async () => {
    render(<Usuarios />);

    await waitFor(() => {
      expect(screen.getByText('Médico')).toBeInTheDocument();
    });
  });

  it('deve exibir "—" quando telefone for nulo', async () => {
    render(<Usuarios />);

    await waitFor(() => {
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  it('deve abrir o modal ao clicar em "Novo Usuário"', async () => {
    render(<Usuarios />);

    await screen.findByText('admin@clinica.com');
    fireEvent.click(screen.getByRole('button', { name: /novo usuário/i }));

    expect(screen.getByTestId('usuario-modal')).toBeInTheDocument();
  });

  it('deve abrir o modal ao clicar em editar', async () => {
    render(<Usuarios />);

    await waitFor(() => screen.getByText('admin@clinica.com'));

    fireEvent.click(screen.getByRole('button', { name: 'Editar usuário Ana Santos' }));

    expect(screen.getByTestId('usuario-modal')).toBeInTheDocument();
  });

  it('deve chamar deletar com o id correto ao confirmar exclusão', async () => {
    render(<Usuarios />);

    await waitFor(() => screen.getByText('admin@clinica.com'));

    fireEvent.click(screen.getByRole('button', { name: 'Excluir usuário Ana Santos' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remover' }));

    await waitFor(() => {
      expect(mockDeletar).toHaveBeenCalledWith(1);
    });
  });

  it('não deve chamar deletar quando cancelar a confirmação', async () => {
    render(<Usuarios />);

    await waitFor(() => screen.getByText('admin@clinica.com'));

    fireEvent.click(screen.getByRole('button', { name: 'Excluir usuário Ana Santos' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(mockDeletar).not.toHaveBeenCalled();
  });

  it('deve exibir aviso especial ao excluir médico com consultas já canceladas/realizadas', async () => {
    mockContarConsultasVinculadas.mockResolvedValue({ total: 3, ativas: 0 });
    render(<Usuarios />);

    await waitFor(() => screen.getByText('medico@clinica.com'));

    fireEvent.click(screen.getByRole('button', { name: 'Excluir usuário Dr. Carlos' }));

    await waitFor(() => {
      expect(mockContarConsultasVinculadas).toHaveBeenCalledWith(2);
      expect(
        screen.getByText(/perdem a vinculação com um médico, mas continuam existindo/i),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Remover' }));

    await waitFor(() => {
      expect(mockDeletar).toHaveBeenCalledWith(2);
    });
  });

  it('não deve exibir aviso especial ao excluir médico sem consultas vinculadas', async () => {
    mockContarConsultasVinculadas.mockResolvedValue({ total: 0, ativas: 0 });
    render(<Usuarios />);

    await waitFor(() => screen.getByText('medico@clinica.com'));

    fireEvent.click(screen.getByRole('button', { name: 'Excluir usuário Dr. Carlos' }));

    await waitFor(() => {
      expect(
        screen.getByText('Deseja remover o usuário Dr. Carlos? Esta ação não pode ser desfeita.'),
      ).toBeInTheDocument();
    });
  });

  it('deve bloquear a exclusão e não abrir modal quando o médico tem consulta agendada ou confirmada', async () => {
    mockContarConsultasVinculadas.mockResolvedValue({ total: 2, ativas: 2 });
    render(<Usuarios />);

    await waitFor(() => screen.getByText('medico@clinica.com'));

    fireEvent.click(screen.getByRole('button', { name: 'Excluir usuário Dr. Carlos' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('há 2 consulta(s) agendada(s) ou confirmada(s)'),
      );
    });

    expect(screen.queryByRole('button', { name: 'Remover' })).not.toBeInTheDocument();
    expect(mockDeletar).not.toHaveBeenCalled();
  });
});
