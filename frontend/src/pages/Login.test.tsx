import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Login from './Login';
import { AuthService } from '@/services/AuthService';
import { useAuth } from '@/context/AuthContext';

vi.mock('@/services/AuthService', () => ({
  AuthService: { login: vi.fn() },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../assets/images/logo-isg.png', () => ({ default: 'logo.png' }));

const mockNavigate = vi.fn();
const mockLogin = vi.fn();

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
const mockAuthServiceLogin = AuthService.login as ReturnType<typeof vi.fn>;

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );

beforeEach(() => {
  mockUseAuth.mockReturnValue({ login: mockLogin });
  mockNavigate.mockClear();
  mockLogin.mockClear();
  mockAuthServiceLogin.mockClear();
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('Login', () => {
  it('deve renderizar o formulário com campos de e-mail e senha', () => {
    renderLogin();

    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('deve renderizar o checkbox "Manter-me conectado"', () => {
    renderLogin();

    expect(screen.getByLabelText('Manter-me conectado')).toBeInTheDocument();
  });

  it('deve pré-preencher o e-mail quando há e-mail salvo no localStorage', () => {
    localStorage.setItem('login_email_salvo', 'salvo@clinica.com');

    renderLogin();

    expect(screen.getByLabelText('E-mail')).toHaveValue('salvo@clinica.com');
  });

  it('deve marcar o checkbox quando há e-mail salvo no localStorage', () => {
    localStorage.setItem('login_email_salvo', 'salvo@clinica.com');

    renderLogin();

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('data-state', 'checked');
  });

  it('deve chamar AuthService.login com email e senha ao submeter', async () => {
    mockAuthServiceLogin.mockResolvedValue({
      token: 'tok',
      user: { id: 1, nome: 'Admin', email: 'admin@clinica.com', role: 'ADMIN' },
    });

    renderLogin();

    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'admin@clinica.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'senha123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(mockAuthServiceLogin).toHaveBeenCalledWith('admin@clinica.com', 'senha123');
    });
  });

  it('deve navegar para /home após login bem-sucedido', async () => {
    mockAuthServiceLogin.mockResolvedValue({
      token: 'tok',
      user: { id: 1, nome: 'Admin', email: 'admin@clinica.com', role: 'ADMIN' },
    });

    renderLogin();

    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'admin@clinica.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'senha123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });
  });

  it('deve salvar o e-mail no localStorage quando "Manter-me conectado" está marcado', async () => {
    mockAuthServiceLogin.mockResolvedValue({
      token: 'tok',
      user: { id: 1, nome: 'Admin', email: 'admin@clinica.com', role: 'ADMIN' },
    });

    renderLogin();

    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'admin@clinica.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'senha123' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(localStorage.getItem('login_email_salvo')).toBe('admin@clinica.com');
    });
  });

  it('deve remover o e-mail do localStorage quando "Manter-me conectado" está desmarcado', async () => {
    localStorage.setItem('login_email_salvo', 'admin@clinica.com');
    mockAuthServiceLogin.mockResolvedValue({
      token: 'tok',
      user: { id: 1, nome: 'Admin', email: 'admin@clinica.com', role: 'ADMIN' },
    });

    renderLogin();

    // desmarcar o checkbox (que começou marcado por causa do localStorage)
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'senha123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(localStorage.getItem('login_email_salvo')).toBeNull();
    });
  });

  it('deve exibir mensagem de erro quando as credenciais são inválidas', async () => {
    mockAuthServiceLogin.mockRejectedValue(new Error('Unauthorized'));

    renderLogin();

    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'errado@clinica.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'senhaErrada' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(screen.getByText('E-mail ou senha inválidos')).toBeInTheDocument();
    });
  });

  it('deve exibir "Entrando..." durante o carregamento', async () => {
    mockAuthServiceLogin.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 500)),
    );

    renderLogin();

    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'admin@clinica.com' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'senha123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(screen.getByRole('button', { name: 'Entrando...' })).toBeDisabled();
  });
});
