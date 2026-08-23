import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { ProntuariosService } from './prontuarios.service';

const admin: AuthenticatedUser = {
  id: 1,
  email: 'admin@clinica.test',
  role: Role.ADMIN,
};

const medico: AuthenticatedUser = {
  id: 2,
  email: 'medico@clinica.test',
  role: Role.MEDICO,
};

const outroMedico: AuthenticatedUser = {
  id: 3,
  email: 'outro@clinica.test',
  role: Role.MEDICO,
};

const secretaria: AuthenticatedUser = {
  id: 4,
  email: 'secretaria@clinica.test',
  role: Role.SECRETARIA,
};

const consulta = {
  id: 10,
  medicoId: medico.id,
};

const prontuario = {
  id: 20,
  consultaId: consulta.id,
  anamnese: 'Conteúdo clínico',
  diagnostico: null,
  prescricao: null,
  observacoes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  consulta: {
    id: consulta.id,
    paciente: { id: 30, nome: 'Paciente', cpf: '000.000.000-00' },
    medico: { id: medico.id, nome: 'Médico', especialidade: 'Clínica' },
  },
};

const prisma = {
  consulta: {
    findUnique: jest.fn(),
  },
  prontuario: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('ProntuariosService', () => {
  let service: ProntuariosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProntuariosService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProntuariosService>(ProntuariosService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create()', () => {
    const dto = { consultaId: consulta.id, anamnese: 'Anamnese' };

    it('deve permitir que o médico crie prontuário da própria consulta', async () => {
      prisma.consulta.findUnique.mockResolvedValue(consulta);
      prisma.prontuario.findUnique.mockResolvedValue(null);
      prisma.prontuario.create.mockResolvedValue(prontuario);

      await expect(service.create(dto, medico)).resolves.toEqual(prontuario);
      expect(prisma.prontuario.create).toHaveBeenCalled();
    });

    it('deve permitir que administrador crie prontuário de qualquer consulta', async () => {
      prisma.consulta.findUnique.mockResolvedValue(consulta);
      prisma.prontuario.findUnique.mockResolvedValue(null);
      prisma.prontuario.create.mockResolvedValue(prontuario);

      await expect(service.create(dto, admin)).resolves.toEqual(prontuario);
      expect(prisma.prontuario.create).toHaveBeenCalled();
    });

    it('deve negar criação para consulta de outro médico', async () => {
      prisma.consulta.findUnique.mockResolvedValue(consulta);

      await expect(service.create(dto, outroMedico)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.prontuario.create).not.toHaveBeenCalled();
    });

    it('deve negar criação para secretária', async () => {
      await expect(service.create(dto, secretaria)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.consulta.findUnique).not.toHaveBeenCalled();
    });

    it('deve retornar 404 quando a consulta não existe', async () => {
      prisma.consulta.findUnique.mockResolvedValue(null);

      await expect(service.create(dto, medico)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve retornar conflito quando já existe prontuário', async () => {
      prisma.consulta.findUnique.mockResolvedValue(consulta);
      prisma.prontuario.findUnique.mockResolvedValue(prontuario);

      await expect(service.create(dto, medico)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll()', () => {
    it('deve filtrar a listagem do médico pelas próprias consultas', async () => {
      prisma.prontuario.findMany.mockResolvedValue([prontuario]);

      await service.findAll(medico);

      expect(prisma.prontuario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { consulta: { medicoId: medico.id } },
        }),
      );
    });

    it('deve permitir que administrador liste todos os prontuários', async () => {
      prisma.prontuario.findMany.mockResolvedValue([prontuario]);

      await service.findAll(admin);

      expect(prisma.prontuario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('deve negar a listagem para secretária', async () => {
      expect(() => service.findAll(secretaria)).toThrow(ForbiddenException);
      expect(prisma.prontuario.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findOne()', () => {
    it('deve permitir consulta pelo médico responsável', async () => {
      prisma.prontuario.findUnique.mockResolvedValue(prontuario);

      await expect(service.findOne(prontuario.id, medico)).resolves.toEqual(
        prontuario,
      );
    });

    it('deve permitir consulta por administrador', async () => {
      prisma.prontuario.findUnique.mockResolvedValue(prontuario);

      await expect(service.findOne(prontuario.id, admin)).resolves.toEqual(
        prontuario,
      );
    });

    it('deve retornar 403 quando o prontuário existe mas pertence a outro médico', async () => {
      prisma.prontuario.findUnique.mockResolvedValue(prontuario);

      await expect(service.findOne(prontuario.id, outroMedico)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deve retornar 404 quando o prontuário não existe', async () => {
      prisma.prontuario.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999, medico)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByConsulta()', () => {
    it('deve negar acesso por consulta de outro médico', async () => {
      prisma.prontuario.findUnique.mockResolvedValue(prontuario);

      await expect(
        service.findByConsulta(consulta.id, outroMedico),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve permitir acesso por consulta ao administrador', async () => {
      prisma.prontuario.findUnique.mockResolvedValue(prontuario);

      await expect(service.findByConsulta(consulta.id, admin)).resolves.toEqual(
        prontuario,
      );
    });
  });

  describe('update()', () => {
    it('deve atualizar prontuário da própria consulta', async () => {
      prisma.prontuario.findUnique.mockResolvedValue(prontuario);
      prisma.prontuario.update.mockResolvedValue({
        ...prontuario,
        diagnostico: 'Atualizado',
      });

      await service.update(
        prontuario.id,
        { diagnostico: 'Atualizado' },
        medico,
      );

      expect(prisma.prontuario.update).toHaveBeenCalled();
    });

    it('deve negar atualização por outro médico', async () => {
      prisma.prontuario.findUnique.mockResolvedValue(prontuario);

      await expect(
        service.update(prontuario.id, { diagnostico: 'Indevido' }, outroMedico),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.prontuario.update).not.toHaveBeenCalled();
    });
  });

  describe('remove()', () => {
    it('deve permitir exclusão pelo administrador', async () => {
      prisma.prontuario.findUnique.mockResolvedValue(prontuario);
      prisma.prontuario.delete.mockResolvedValue(prontuario);

      await service.remove(prontuario.id, admin);

      expect(prisma.prontuario.delete).toHaveBeenCalledWith({
        where: { id: prontuario.id },
      });
    });

    it('deve negar exclusão por outro médico', async () => {
      prisma.prontuario.findUnique.mockResolvedValue(prontuario);

      await expect(service.remove(prontuario.id, outroMedico)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.prontuario.delete).not.toHaveBeenCalled();
    });
  });
});
