import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Configuracoes from './Configuracoes';
import { useAuth } from '@/context/AuthContext';
import { UsuarioService } from '@/services/UsuarioService';
import { WhatsappService } from '@/services/WhatsappService';

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/services/UsuarioService', () => ({
  UsuarioService: {
    me: vi.fn(),
    atualizarMe: vi.fn(),
  },
}));

vi.mock('@/services/WhatsappService', () => ({
  WhatsappService: {
    status: vi.fn(),
    conectar: vi.fn(),
    desconectar: vi.fn(),
  },
}));

vi.mock('@/components/ui/sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/components/layout/PageShell', () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
const mockMe = UsuarioService.me as ReturnType<typeof vi.fn>;
const mockStatus = WhatsappService.status as ReturnType<typeof vi.fn>;
const mockConectar = WhatsappService.conectar as ReturnType<typeof vi.fn>;
const mockDesconectar = WhatsappService.desconectar as ReturnType<typeof vi.fn>;

const authAdmin = {
  user: { id: 1, nome: 'Admin', email: 'admin@clinica.com', role: 'ADMIN' },
  isAdmin: () => true,
  isSecretaria: () => false,
  isMedico: () => false,
  updateUser: vi.fn(),
};

const authSecretaria = {
  user: { id: 2, nome: 'Secretária', email: 'secretaria@clinica.com', role: 'SECRETARIA' },
  isAdmin: () => false,
  isSecretaria: () => true,
  isMedico: () => false,
  updateUser: vi.fn(),
};

const usuarioMock = {
  id: 1,
  nome: 'Admin',
  email: 'admin@clinica.com',
  role: 'ADMIN',
  telefone: '',
  crm: '',
  especialidade: '',
};

beforeEach(() => {
  mockMe.mockResolvedValue(usuarioMock);
  mockStatus.mockResolvedValue({ status: 'DESCONECTADO', qr: null });
  mockConectar.mockResolvedValue({ status: 'AGUARDANDO_QR', qr: 'data:image/png;base64,FAKE' });
  mockDesconectar.mockResolvedValue({ status: 'DESCONECTADO', qr: null });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Configuracoes', () => {
  it('não deve exibir o card de conexão WhatsApp para SECRETARIA', async () => {
    mockUseAuth.mockReturnValue(authSecretaria);

    render(<Configuracoes />);

    await screen.findByText('admin@clinica.com');
    expect(screen.queryByText('Conexão WhatsApp')).not.toBeInTheDocument();
  });

  it('deve exibir o card de conexão WhatsApp para ADMIN com o status atual', async () => {
    mockUseAuth.mockReturnValue(authAdmin);

    render(<Configuracoes />);

    await waitFor(() => {
      expect(screen.getByText('Conexão WhatsApp')).toBeInTheDocument();
      expect(screen.getByText('Desconectado')).toBeInTheDocument();
    });
  });

  it('deve chamar conectar ao clicar em Conectar', async () => {
    mockUseAuth.mockReturnValue(authAdmin);

    render(<Configuracoes />);
    await screen.findByText('Conexão WhatsApp');

    fireEvent.click(screen.getByRole('button', { name: 'Conectar' }));

    await waitFor(() => {
      expect(mockConectar).toHaveBeenCalled();
      expect(screen.getByText('Aguardando leitura do QR Code')).toBeInTheDocument();
    });
  });

  it('deve chamar desconectar ao clicar em Desconectar quando já conectado', async () => {
    mockUseAuth.mockReturnValue(authAdmin);
    mockStatus.mockResolvedValue({ status: 'CONECTADO', qr: null });

    render(<Configuracoes />);
    await screen.findByText('Conectado');

    fireEvent.click(screen.getByRole('button', { name: 'Desconectar' }));

    await waitFor(() => {
      expect(mockDesconectar).toHaveBeenCalled();
    });
  });
});
