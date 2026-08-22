import { Role } from '@prisma/client';
import {
  AdminBootstrapEnvironment,
  AdminBootstrapStore,
  bootstrapFirstAdmin,
} from './bootstrap-admin';

const environment: AdminBootstrapEnvironment = {
  ADMIN_NOME: 'Administrador Inicial',
  ADMIN_EMAIL: 'admin@clinica.test',
  ADMIN_PASSWORD: 'SenhaForte#123',
};

function createStore(): jest.Mocked<AdminBootstrapStore> {
  return {
    findByEmail: jest.fn().mockResolvedValue(null),
    findAnyAdmin: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue(undefined),
  };
}

describe('bootstrapFirstAdmin', () => {
  it('deve validar as variáveis obrigatórias', async () => {
    const store = createStore();

    await expect(bootstrapFirstAdmin(store, {}, jest.fn())).rejects.toThrow(
      'ADMIN_NOME é obrigatória',
    );
    expect(store.findByEmail).not.toHaveBeenCalled();
  });

  it('deve criar ADMIN com senha hasheada sem persistir a senha original', async () => {
    const store = createStore();
    const hashPassword = jest.fn().mockResolvedValue('hash-seguro');

    await expect(
      bootstrapFirstAdmin(store, environment, hashPassword),
    ).resolves.toBe('created');

    expect(hashPassword).toHaveBeenCalledWith('SenhaForte#123');
    expect(store.create).toHaveBeenCalledWith({
      nome: 'Administrador Inicial',
      email: 'admin@clinica.test',
      senha: 'hash-seguro',
      role: Role.ADMIN,
    });
  });

  it('deve ser idempotente e não redefinir senha de ADMIN existente', async () => {
    const store = createStore();
    store.findByEmail.mockResolvedValue({ role: Role.ADMIN });
    const hashPassword = jest.fn();

    await expect(
      bootstrapFirstAdmin(store, environment, hashPassword),
    ).resolves.toBe('already-exists');

    expect(hashPassword).not.toHaveBeenCalled();
    expect(store.create).not.toHaveBeenCalled();
  });

  it('deve recusar e-mail pertencente a outro perfil', async () => {
    const store = createStore();
    store.findByEmail.mockResolvedValue({ role: Role.SECRETARIA });

    await expect(
      bootstrapFirstAdmin(store, environment, jest.fn()),
    ).rejects.toThrow(/não é administrador/);
    expect(store.create).not.toHaveBeenCalled();
  });

  it('não deve criar outro primeiro ADMIN quando já existir um', async () => {
    const store = createStore();
    store.findAnyAdmin.mockResolvedValue({ id: 99 });
    const hashPassword = jest.fn();

    await expect(
      bootstrapFirstAdmin(store, environment, hashPassword),
    ).resolves.toBe('already-exists');

    expect(hashPassword).not.toHaveBeenCalled();
    expect(store.create).not.toHaveBeenCalled();
  });
});
