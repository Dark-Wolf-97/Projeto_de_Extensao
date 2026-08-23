import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NovaConsultaModal } from './NovaConsultaModal';

vi.mock('@/services/ConsultaService', () => ({
  ConsultaService: {
    criar: vi.fn(),
    atualizar: vi.fn(),
  },
}));

vi.mock('@/services/PacienteService', () => ({
  PacienteService: {
    buscar: vi.fn(),
  },
}));

vi.mock('@/services/UsuarioService', () => ({
  UsuarioService: {
    listarMedicos: vi.fn().mockReturnValue(new Promise(() => {})),
  },
}));

vi.mock('@/components/ui/sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('NovaConsultaModal', () => {
  it('mantém o salvamento bloqueado até paciente e médico serem selecionados', () => {
    render(
      <NovaConsultaModal
        open
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
  });
});
