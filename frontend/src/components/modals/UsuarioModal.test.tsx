import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UsuarioModal } from './UsuarioModal';
import { UsuarioService } from '@/services/UsuarioService';
import { toast } from 'sonner';

vi.mock('@/services/UsuarioService', () => ({
  UsuarioService: {
    criar: vi.fn(),
    atualizar: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockCriar = UsuarioService.criar as ReturnType<typeof vi.fn>;
const mockAtualizar = UsuarioService.atualizar as ReturnType<typeof vi.fn>;
const mockOnOpenChange = vi.fn();
const mockOnSaved = vi.fn();

const renderModal = (usuario = null as any, open = true) =>
  render(
    <UsuarioModal
      open={open}
      onOpenChange={mockOnOpenChange}
      onSaved={mockOnSaved}
      usuario={usuario}
    />,
  );

beforeEach(() => {
  mockCriar.mockResolvedValue({ id: 99 });
  mockAtualizar.mockResolvedValue({ id: 1 });
});

afterEach(() => vi.clearAllMocks());

describe('UsuarioModal', () => {
  describe('campos básicos', () => {
    it('deve renderizar os campos Nome, E-mail, Senha, Perfil e Telefone', () => {
      renderModal();

      expect(screen.getByLabelText('Nome')).toBeInTheDocument();
      expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
      expect(screen.getByLabelText('Senha')).toBeInTheDocument();
      expect(screen.getByLabelText('Perfil')).toBeInTheDocument();
      expect(screen.getByLabelText('Telefone')).toBeInTheDocument();
    });

    it('deve mostrar título "Novo Usuário" quando não há usuário selecionado', () => {
      renderModal();

      expect(screen.getByText('Novo Usuário')).toBeInTheDocument();
    });

    it('deve mostrar título "Editar Usuário" quando há usuário selecionado', () => {
      renderModal({
        id: 1,
        nome: 'Admin',
        email: 'admin@clinica.com',
        role: 'ADMIN',
      });

      expect(screen.getByText('Editar Usuário')).toBeInTheDocument();
    });
  });

  describe('campos CRM e Especialidade', () => {
    it('não deve exibir CRM e Especialidade quando perfil é ADMIN', () => {
      renderModal();

      expect(screen.queryByLabelText('CRM')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Especialidade')).not.toBeInTheDocument();
    });

    it('não deve exibir CRM e Especialidade quando perfil é SECRETARIA', () => {
      renderModal();

      fireEvent.change(screen.getByLabelText('Perfil'), {
        target: { value: 'SECRETARIA' },
      });

      expect(screen.queryByLabelText('CRM')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Especialidade')).not.toBeInTheDocument();
    });

    it('deve exibir CRM e Especialidade quando perfil é MÉDICO', () => {
      renderModal();

      fireEvent.change(screen.getByLabelText('Perfil'), {
        target: { value: 'MEDICO' },
      });

      expect(screen.getByLabelText('CRM')).toBeInTheDocument();
      expect(screen.getByLabelText('Especialidade')).toBeInTheDocument();
    });

    it('deve pré-preencher CRM e Especialidade ao editar um médico', () => {
      renderModal({
        id: 2,
        nome: 'Dr. Carlos',
        email: 'medico@clinica.com',
        role: 'MEDICO',
        crm: 'CRM-SP-12345',
        especialidade: 'Clínica Geral',
      });

      expect(screen.getByLabelText('CRM')).toHaveValue('CRM-SP-12345');
      expect(screen.getByLabelText('Especialidade')).toHaveValue('Clínica Geral');
    });
  });

  describe('validações', () => {
    it('deve mostrar erro quando criar usuário sem senha', async () => {
      renderModal();

      fireEvent.change(screen.getByLabelText('Nome'), {
        target: { value: 'Novo Usuario' },
      });
      fireEvent.change(screen.getByLabelText('E-mail'), {
        target: { value: 'novo@clinica.com' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Informe uma senha para o novo usuário',
        );
      });

      expect(mockCriar).not.toHaveBeenCalled();
    });
  });

  describe('submit', () => {
    it('deve chamar criar com os dados corretos ao salvar novo usuário', async () => {
      renderModal();

      fireEvent.change(screen.getByLabelText('Nome'), {
        target: { value: 'Nova Secretaria' },
      });
      fireEvent.change(screen.getByLabelText('E-mail'), {
        target: { value: 'sec@clinica.com' },
      });
      fireEvent.change(screen.getByLabelText('Senha'), {
        target: { value: 'Senha@123' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

      await waitFor(() => {
        expect(mockCriar).toHaveBeenCalledWith(
          expect.objectContaining({
            nome: 'Nova Secretaria',
            email: 'sec@clinica.com',
            senha: 'Senha@123',
            role: 'SECRETARIA',
          }),
        );
      });
    });

    it('deve chamar atualizar ao salvar usuário existente', async () => {
      renderModal({
        id: 1,
        nome: 'Admin',
        email: 'admin@clinica.com',
        role: 'ADMIN',
      });

      fireEvent.change(screen.getByLabelText('Nome'), {
        target: { value: 'Admin Atualizado' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

      await waitFor(() => {
        expect(mockAtualizar).toHaveBeenCalledWith(
          1,
          expect.objectContaining({ nome: 'Admin Atualizado' }),
        );
      });
    });

    it('deve mostrar toast de sucesso ao criar', async () => {
      renderModal();

      fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Teste' } });
      fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 't@t.com' } });
      fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'Senha@123' } });

      fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Usuário criado com sucesso!');
      });
    });

    it('deve mostrar erro específico quando e-mail já está cadastrado (409)', async () => {
      mockCriar.mockRejectedValue(new Error('Erro 409: Conflict'));

      renderModal();

      fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Teste' } });
      fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'dup@clinica.com' } });
      fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'Senha@123' } });

      fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'E-mail já cadastrado para outro usuário',
        );
      });
    });

    it('deve mostrar erro genérico para outros erros', async () => {
      mockCriar.mockRejectedValue(new Error('Erro 500: Internal Server Error'));

      renderModal();

      fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Teste' } });
      fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'teste@clinica.com' } });
      fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'Senha@123' } });

      fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Erro ao salvar usuário');
      });
    });
  });

  describe('máscara de telefone', () => {
    it('deve formatar telefone enquanto digita', () => {
      renderModal();

      const input = screen.getByLabelText('Telefone');
      fireEvent.change(input, { target: { value: '11999990000' } });

      expect(input).toHaveValue('(11) 99999-0000');
    });

    it('deve pré-formatar telefone ao editar', () => {
      renderModal({
        id: 1,
        nome: 'Admin',
        email: 'admin@clinica.com',
        role: 'ADMIN',
        telefone: '11999990000',
      });

      expect(screen.getByLabelText('Telefone')).toHaveValue('(11) 99999-0000');
    });
  });
});
