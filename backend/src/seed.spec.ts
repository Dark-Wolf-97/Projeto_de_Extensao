import { Role } from '@prisma/client';
import { SeedUserStore, seedRoleUser } from './seed';

function createStore(): jest.Mocked<SeedUserStore> {
  return {
    findByEmail: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue(undefined),
  };
}

describe('seedRoleUser', () => {
  it('deve ignorar o perfil quando nenhuma variável estiver definida', async () => {
    const store = createStore();
    const hashPassword = jest.fn();

    await expect(
      seedRoleUser(store, Role.SECRETARIA, 'SECRETARIA', {}, hashPassword),
    ).resolves.toBe('skipped');

    expect(store.findByEmail).not.toHaveBeenCalled();
    expect(hashPassword).not.toHaveBeenCalled();
  });

  it('deve falhar quando o perfil estiver parcialmente configurado', async () => {
    const store = createStore();

    await expect(
      seedRoleUser(
        store,
        Role.SECRETARIA,
        'SECRETARIA',
        { nome: 'Secretaria Inicial' },
        jest.fn(),
      ),
    ).rejects.toThrow('SECRETARIA_EMAIL é obrigatória');
  });

  it('deve criar SECRETARIA com senha hasheada sem persistir a senha original', async () => {
    const store = createStore();
    const hashPassword = jest.fn().mockResolvedValue('hash-seguro');

    await expect(
      seedRoleUser(
        store,
        Role.SECRETARIA,
        'SECRETARIA',
        {
          nome: 'Secretaria Inicial',
          email: 'secretaria@clinica.test',
          senha: 'SenhaForte#123',
        },
        hashPassword,
      ),
    ).resolves.toBe('created');

    expect(hashPassword).toHaveBeenCalledWith('SenhaForte#123');
    expect(store.create).toHaveBeenCalledWith({
      nome: 'Secretaria Inicial',
      email: 'secretaria@clinica.test',
      senha: 'hash-seguro',
      role: Role.SECRETARIA,
      crm: undefined,
      especialidade: undefined,
      telefone: undefined,
    });
  });

  it('deve exigir CRM e especialidade para MEDICO', async () => {
    const store = createStore();

    await expect(
      seedRoleUser(
        store,
        Role.MEDICO,
        'MEDICO',
        {
          nome: 'Medico Inicial',
          email: 'medico@clinica.test',
          senha: 'SenhaForte#123',
        },
        jest.fn(),
      ),
    ).rejects.toThrow('MEDICO_CRM é obrigatória');
  });

  it('deve criar MEDICO com CRM e especialidade', async () => {
    const store = createStore();
    const hashPassword = jest.fn().mockResolvedValue('hash-seguro');

    await expect(
      seedRoleUser(
        store,
        Role.MEDICO,
        'MEDICO',
        {
          nome: 'Medico Inicial',
          email: 'medico@clinica.test',
          senha: 'SenhaForte#123',
          crm: '12345-SP',
          especialidade: 'Clínico Geral',
        },
        hashPassword,
      ),
    ).resolves.toBe('created');

    expect(store.create).toHaveBeenCalledWith({
      nome: 'Medico Inicial',
      email: 'medico@clinica.test',
      senha: 'hash-seguro',
      role: Role.MEDICO,
      crm: '12345-SP',
      especialidade: 'Clínico Geral',
      telefone: undefined,
    });
  });

  it('deve ser idempotente quando o usuário já existe com o mesmo perfil', async () => {
    const store = createStore();
    store.findByEmail.mockResolvedValue({ role: Role.SECRETARIA });
    const hashPassword = jest.fn();

    await expect(
      seedRoleUser(
        store,
        Role.SECRETARIA,
        'SECRETARIA',
        {
          nome: 'Secretaria Inicial',
          email: 'secretaria@clinica.test',
          senha: 'SenhaForte#123',
        },
        hashPassword,
      ),
    ).resolves.toBe('already-exists');

    expect(hashPassword).not.toHaveBeenCalled();
    expect(store.create).not.toHaveBeenCalled();
  });

  it('deve recusar e-mail que já pertence a outro perfil', async () => {
    const store = createStore();
    store.findByEmail.mockResolvedValue({ role: Role.MEDICO });

    await expect(
      seedRoleUser(
        store,
        Role.SECRETARIA,
        'SECRETARIA',
        {
          nome: 'Secretaria Inicial',
          email: 'secretaria@clinica.test',
          senha: 'SenhaForte#123',
        },
        jest.fn(),
      ),
    ).rejects.toThrow(/outro perfil/);
  });
});
