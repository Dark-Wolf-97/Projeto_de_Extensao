import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NovoPacienteModal } from './NovoPacienteModal';

vi.mock('@/services/PacienteService', () => ({
  PacienteService: {
    criar: vi.fn(),
    atualizar: vi.fn(),
  },
}));

describe('NovoPacienteModal', () => {
  it('mantém o salvamento bloqueado enquanto os campos obrigatórios não forem válidos', () => {
    render(
      <NovoPacienteModal
        open
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
  });
});
