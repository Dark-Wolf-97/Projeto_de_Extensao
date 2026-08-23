import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-user.interface';
import { ProntuariosController } from './prontuarios.controller';
import { ProntuariosService } from './prontuarios.service';

const request: AuthenticatedRequest = {
  user: {
    id: 7,
    email: 'medico@clinica.test',
    role: Role.MEDICO,
  },
};

describe('ProntuariosController', () => {
  let controller: ProntuariosController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findByConsulta: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProntuariosController],
      providers: [
        {
          provide: ProntuariosService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findByConsulta: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProntuariosController>(ProntuariosController);
    service = module.get(ProntuariosService);
  });

  it('deve restringir todos os endpoints clínicos, sem permitir SECRETARIA', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, ProntuariosController.prototype.create),
    ).toEqual([Role.ADMIN, Role.MEDICO]);

    for (const method of [
      'findAll',
      'findByConsulta',
      'findOne',
      'update',
      'remove',
    ] as const) {
      expect(
        Reflect.getMetadata(ROLES_KEY, ProntuariosController.prototype[method]),
      ).toEqual(expect.arrayContaining([Role.ADMIN, Role.MEDICO]));
      expect(
        Reflect.getMetadata(ROLES_KEY, ProntuariosController.prototype[method]),
      ).not.toContain(Role.SECRETARIA);
    }
  });

  it('deve encaminhar o usuário autenticado na criação', () => {
    const dto = { consultaId: 10, anamnese: 'Anamnese' };

    controller.create(dto, request);

    expect(service.create).toHaveBeenCalledWith(dto, request.user);
  });

  it('deve encaminhar o usuário autenticado nas leituras', () => {
    controller.findAll(request);
    controller.findByConsulta('10', request);
    controller.findOne('20', request);

    expect(service.findAll).toHaveBeenCalledWith(request.user);
    expect(service.findByConsulta).toHaveBeenCalledWith(10, request.user);
    expect(service.findOne).toHaveBeenCalledWith(20, request.user);
  });
});
