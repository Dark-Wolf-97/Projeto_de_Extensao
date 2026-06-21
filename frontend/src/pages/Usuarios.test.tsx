import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Usuarios from './Usuarios';
import { UsuarioService } from '@/services/UsuarioService';

vi.mock('@/services/UsuarioService', () => ({
  UsuarioService: {
    listar: vi.fn(),
    deletar: vi.fn(),
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
const confirmSpy = vi.spyOn(window, 'confirm');

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
  confirmSpy.mockReturnValue(true);
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

    fireEvent.click(screen.getByRole('button', { name: /novo usuário/i }));

    expect(screen.getByTestId('usuario-modal')).toBeInTheDocument();
  });

  it('deve abrir o modal ao clicar em editar', async () => {
    render(<Usuarios />);

    await waitFor(() => screen.getByText('admin@clinica.com'));

    const rows = screen.getAllByRole('row');
    const botoesLinhAdmin = within(rows[1]).getAllByRole('button');
    fireEvent.click(botoesLinhAdmin[0]);

    expect(screen.getByTestId('usuario-modal')).toBeInTheDocument();
  });

  it('deve chamar deletar com o id correto ao confirmar exclusão', async () => {
    render(<Usuarios />);

    await waitFor(() => screen.getByText('admin@clinica.com'));

    const rows = screen.getAllByRole('row');
    const botoesLinhaAdmin = within(rows[1]).getAllByRole('button');
    fireEvent.click(botoesLinhaAdmin[1]);

    await waitFor(() => {
      expect(mockDeletar).toHaveBeenCalledWith(1);
    });
  });

  it('não deve chamar deletar quando cancelar a confirmação', async () => {
    confirmSpy.mockReturnValue(false);

    render(<Usuarios />);

    await waitFor(() => screen.getByText('admin@clinica.com'));

    const rows = screen.getAllByRole('row');
    const botoesLinhaAdmin = within(rows[1]).getAllByRole('button');
    fireEvent.click(botoesLinhaAdmin[1]);

    expect(mockDeletar).not.toHaveBeenCalled();
  });
});
