import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockAdmin = {
  id: 1,
  nome: 'Administrador',
  email: 'admin@clinica.com',
  role: Role.ADMIN,
  crm: null,
  especialidade: null,
  telefone: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockMedico = {
  id: 2,
  nome: 'Dr. Carlos Silva',
  email: 'medico@clinica.com',
  role: Role.MEDICO,
  crm: 'CRM-SP-12345',
  especialidade: 'Clínica Geral',
  telefone: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UsersController', () => {
  let controller: UsersController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findMedicos: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockAdmin),
            findAll: jest.fn().mockResolvedValue([mockAdmin, mockMedico]),
            findMedicos: jest.fn().mockResolvedValue([mockMedico]),
            findOne: jest.fn().mockResolvedValue(mockAdmin),
            update: jest.fn().mockResolvedValue(mockAdmin),
            remove: jest.fn().mockResolvedValue(mockAdmin),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create()', () => {
    it('deve criar um usuário e retornar o resultado', async () => {
      const dto = {
        nome: 'Admin',
        email: 'admin@clinica.com',
        senha: 'admin123',
        role: Role.ADMIN,
      };

      const result = await controller.create(dto as any);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockAdmin);
    });
  });

  describe('findAll()', () => {
    it('deve retornar a lista completa de usuários', async () => {
      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('findMedicos()', () => {
    it('deve retornar apenas médicos', async () => {
      const result = await controller.findMedicos();

      expect(service.findMedicos).toHaveBeenCalled();
      expect(result).toEqual([mockMedico]);
    });
  });

  describe('findOne()', () => {
    it('deve buscar usuário pelo id convertido para número', async () => {
      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockAdmin);
    });

    it('deve propagar NotFoundException do service', async () => {
      service.findOne.mockRejectedValue(new NotFoundException('Usuário não encontrado'));

      await expect(controller.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update()', () => {
    it('deve atualizar usuário pelo id convertido para número', async () => {
      const dto = { nome: 'Admin Atualizado' };

      await controller.update('1', dto as any);

      expect(service.update).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('remove()', () => {
    it('deve remover usuário pelo id convertido para número', async () => {
      await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('deve propagar NotFoundException do service', async () => {
      service.remove.mockRejectedValue(new NotFoundException('Usuário não encontrado'));

      await expect(controller.remove('999')).rejects.toThrow(NotFoundException);
    });
  });
});
