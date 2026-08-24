import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { MensagensController } from './mensagens.controller';
import { MensagensService } from './mensagens.service';

describe('MensagensController', () => {
  let controller: MensagensController;
  let service: {
    listarPendentes: jest.Mock;
    listarHistorico: jest.Mock;
    editarConteudo: jest.Mock;
    cancelar: jest.Mock;
    enviarAgora: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MensagensController],
      providers: [
        {
          provide: MensagensService,
          useValue: {
            listarPendentes: jest.fn().mockResolvedValue([]),
            listarHistorico: jest.fn().mockResolvedValue([]),
            editarConteudo: jest.fn().mockResolvedValue({ id: 1 }),
            cancelar: jest.fn().mockResolvedValue({ id: 1 }),
            enviarAgora: jest.fn().mockResolvedValue({ id: 1 }),
          },
        },
      ],
    }).compile();

    controller = module.get(MensagensController);
    service = module.get(MensagensService);
  });

  afterEach(() => jest.clearAllMocks());

  it('deve restringir todas as rotas a ADMIN e SECRETARIA, sem MEDICO', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, MensagensController);
    expect(roles).toEqual([Role.ADMIN, Role.SECRETARIA]);
    expect(roles).not.toContain(Role.MEDICO);
  });

  it('deve encaminhar listagens ao service', async () => {
    await controller.listarPendentes();
    await controller.listarHistorico();

    expect(service.listarPendentes).toHaveBeenCalled();
    expect(service.listarHistorico).toHaveBeenCalled();
  });

  it('deve encaminhar editar/cancelar/enviar-agora com o id convertido para número', async () => {
    await controller.editar('5', { conteudo: 'novo texto' });
    await controller.cancelar('5');
    await controller.enviarAgora('5');

    expect(service.editarConteudo).toHaveBeenCalledWith(5, 'novo texto');
    expect(service.cancelar).toHaveBeenCalledWith(5);
    expect(service.enviarAgora).toHaveBeenCalledWith(5);
  });
});
