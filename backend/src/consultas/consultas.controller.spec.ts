import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StatusConsulta, Role } from '@prisma/client';
import { ConsultasController } from './consultas.controller';
import { ConsultasService } from './consultas.service';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';

const mockConsulta = {
  id: 1,
  pacienteId: 1,
  medicoId: 2,
  data: new Date('2027-01-15T10:00:00'),
  hora: '10:00',
  status: StatusConsulta.AGENDADA,
  observacoes: null,
  paciente: { id: 1, nome: 'Maria Silva', cpf: '123.456.789-00' },
  medico: {
    id: 2,
    nome: 'Dr. Carlos',
    crm: 'CRM-SP-1234',
    especialidade: 'Clínica Geral',
  },
};

const mockConsultaMedico = { ...mockConsulta, id: 2 };

describe('ConsultasController', () => {
  let controller: ConsultasController;
  let service: {
    findAll: jest.Mock;
    findByMedico: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    realizar: jest.Mock;
    recadastrarNaAgenda: jest.Mock;
    buscarLinkAgenda: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsultasController],
      providers: [
        {
          provide: ConsultasService,
          useValue: {
            findAll: jest
              .fn()
              .mockResolvedValue([mockConsulta, mockConsultaMedico]),
            findByMedico: jest.fn().mockResolvedValue([mockConsulta]),
            findOne: jest.fn().mockResolvedValue(mockConsulta),
            create: jest.fn().mockResolvedValue(mockConsulta),
            update: jest.fn().mockResolvedValue(mockConsulta),
            remove: jest.fn().mockResolvedValue(mockConsulta),
            realizar: jest.fn().mockResolvedValue(mockConsulta),
            recadastrarNaAgenda: jest.fn().mockResolvedValue(mockConsulta),
            buscarLinkAgenda: jest
              .fn()
              .mockReturnValue({
                link: 'https://calendar.google.com/calendar',
              }),
          },
        },
      ],
    }).compile();

    controller = module.get<ConsultasController>(ConsultasController);
    service = module.get(ConsultasService);
  });

  afterEach(() => jest.clearAllMocks());

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('deve limitar os endpoints do Google Agenda a ADMIN e SECRETARIA', () => {
    for (const method of ['recadastrarNaAgenda', 'buscarLinkAgenda'] as const) {
      const roles = Reflect.getMetadata(
        ROLES_KEY,
        ConsultasController.prototype[method],
      );
      expect(roles).toEqual([Role.ADMIN, Role.SECRETARIA]);
      expect(roles).not.toContain(Role.MEDICO);
    }
  });

  it('deve encaminhar cadastro e link do Google Agenda ao service', async () => {
    await controller.recadastrarNaAgenda('1');
    const link = controller.buscarLinkAgenda();

    expect(service.recadastrarNaAgenda).toHaveBeenCalledWith(1);
    expect(service.buscarLinkAgenda).toHaveBeenCalled();
    expect(link).toEqual({ link: 'https://calendar.google.com/calendar' });
  });

  it('deve permitir ADMIN e MEDICO marcarem consultas como realizadas', async () => {
    const roles = Reflect.getMetadata(
      ROLES_KEY,
      ConsultasController.prototype.realizar,
    );
    const req = { user: { id: 1, email: 'admin@clinica.test', role: Role.ADMIN } };

    await controller.realizar('1', req);

    expect(roles).toEqual([Role.ADMIN, Role.MEDICO]);
    expect(service.realizar).toHaveBeenCalledWith(1, req.user);
  });

  // ─── findAll ───────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('ADMIN deve receber todas as consultas', async () => {
      const req = { user: { id: 1, role: Role.ADMIN } };

      const result = await controller.findAll(req);

      expect(service.findAll).toHaveBeenCalled();
      expect(service.findByMedico).not.toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('SECRETARIA deve receber todas as consultas', async () => {
      const req = { user: { id: 3, role: Role.SECRETARIA } };

      const result = await controller.findAll(req);

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('MEDICO deve receber apenas suas próprias consultas', async () => {
      const req = { user: { id: 2, role: Role.MEDICO } };

      const result = await controller.findAll(req);

      expect(service.findByMedico).toHaveBeenCalledWith(2);
      expect(service.findAll).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  // ─── findOne ───────────────────────────────────────────────────────────────

  describe('findOne()', () => {
    it('deve buscar consulta convertendo id para número', async () => {
      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
    });

    it('deve propagar NotFoundException do service', async () => {
      service.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('deve criar consulta e retornar o resultado', async () => {
      const dto = {
        pacienteId: 1,
        medicoId: 2,
        data: '2027-01-15',
        hora: '10:00',
      };

      const result = await controller.create(dto as any);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockConsulta);
    });
  });

  // ─── update ────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('deve atualizar consulta convertendo id para número', async () => {
      const dto = { status: StatusConsulta.CONFIRMADA };

      await controller.update('1', dto as any);

      expect(service.update).toHaveBeenCalledWith(1, dto);
    });

    it('deve propagar NotFoundException do service', async () => {
      service.update.mockRejectedValue(new NotFoundException());

      await expect(controller.update('999', {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── remove ────────────────────────────────────────────────────────────────

  describe('remove()', () => {
    it('deve remover consulta convertendo id para número', async () => {
      await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('deve propagar NotFoundException do service', async () => {
      service.remove.mockRejectedValue(new NotFoundException());

      await expect(controller.remove('999')).rejects.toThrow(NotFoundException);
    });
  });
});
