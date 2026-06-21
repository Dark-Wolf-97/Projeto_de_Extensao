import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('bcrypt');

const bcryptHash = bcrypt.hash as jest.Mock;

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const mockAdmin = {
  id: 1,
  nome: 'Administrador',
  email: 'admin@clinica.com',
  role: Role.ADMIN,
  crm: null,
  especialidade: null,
  telefone: '(11) 99999-0000',
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
  telefone: '(11) 99999-0001',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    it('deve criar usuário com senha hasheada', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      bcryptHash.mockResolvedValue('hashed_senha');
      mockPrisma.user.create.mockResolvedValue(mockAdmin);

      const dto = {
        nome: 'Administrador',
        email: 'admin@clinica.com',
        senha: 'admin123',
        role: Role.ADMIN,
      };

      const result = await service.create(dto);

      expect(bcryptHash).toHaveBeenCalledWith('admin123', 10);
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ senha: 'hashed_senha' }) }),
      );
      expect(result).toEqual(mockAdmin);
    });

    it('deve lançar ConflictException quando e-mail já existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockAdmin);

      await expect(
        service.create({
          nome: 'Outro',
          email: 'admin@clinica.com',
          senha: '123456',
          role: Role.SECRETARIA,
        }),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('não deve expor a senha no retorno', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      bcryptHash.mockResolvedValue('hashed');
      mockPrisma.user.create.mockResolvedValue(mockAdmin);

      const result = await service.create({
        nome: 'Admin',
        email: 'admin@clinica.com',
        senha: 'admin123',
        role: Role.ADMIN,
      });

      expect(result).not.toHaveProperty('senha');
    });
  });

  describe('findAll()', () => {
    it('deve retornar lista de usuários ordenada por nome', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockAdmin, mockMedico]);

      const result = await service.findAll();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { nome: 'asc' } }),
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('findMedicos()', () => {
    it('deve retornar apenas usuários com role MEDICO', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockMedico]);

      await service.findMedicos();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { role: 'MEDICO' } }),
      );
    });
  });

  describe('findOne()', () => {
    it('deve retornar o usuário quando encontrado', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockAdmin);

      const result = await service.findOne(1);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
      expect(result).toEqual(mockAdmin);
    });

    it('deve lançar NotFoundException quando usuário não existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update()', () => {
    it('deve atualizar usuário sem alterar senha quando não fornecida', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockAdmin);
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.update.mockResolvedValue({ ...mockAdmin, telefone: '(11) 88888-0000' });

      await service.update(1, { telefone: '(11) 88888-0000' });

      expect(bcryptHash).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it('deve rehashear a senha quando fornecida no update', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockAdmin);
      mockPrisma.user.findFirst.mockResolvedValue(null);
      bcryptHash.mockResolvedValue('nova_hashed');
      mockPrisma.user.update.mockResolvedValue(mockAdmin);

      await service.update(1, { senha: 'novaSenha123' });

      expect(bcryptHash).toHaveBeenCalledWith('novaSenha123', 10);
    });

    it('deve lançar ConflictException quando novo e-mail pertence a outro usuário', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockAdmin);
      mockPrisma.user.findFirst.mockResolvedValue(mockMedico);

      await expect(
        service.update(1, { email: 'medico@clinica.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('deve lançar NotFoundException quando usuário não existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { nome: 'Qualquer' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove()', () => {
    it('deve remover o usuário quando encontrado', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockAdmin);
      mockPrisma.user.delete.mockResolvedValue(mockAdmin);

      await service.remove(1);

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('deve lançar NotFoundException quando usuário não existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.user.delete).not.toHaveBeenCalled();
    });
  });

  describe('findByEmail()', () => {
    it('deve retornar o usuário quando e-mail existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockAdmin);

      const result = await service.findByEmail('admin@clinica.com');

      expect(result).toEqual(mockAdmin);
    });

    it('deve retornar null quando e-mail não existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('inexistente@clinica.com');

      expect(result).toBeNull();
    });
  });
});
