import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PacientesService } from './pacientes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PacientesService', () => {
  let service: PacientesService;
  const prisma = {
    paciente: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    consulta: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PacientesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PacientesService>(PacientesService);
    prisma.consulta.count.mockResolvedValue(0);
  });

  afterEach(() => jest.clearAllMocks());

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  it('deve excluir paciente sem consultas vinculadas', async () => {
    prisma.paciente.findUnique.mockResolvedValue({ id: 1, nome: 'Maria' });
    prisma.paciente.delete.mockResolvedValue({ id: 1, nome: 'Maria' });

    await service.remover(1);

    expect(prisma.consulta.count).toHaveBeenCalledWith({
      where: { pacienteId: 1 },
    });
    expect(prisma.paciente.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('deve retornar conflito ao excluir paciente com consultas', async () => {
    prisma.paciente.findUnique.mockResolvedValue({ id: 1, nome: 'Maria' });
    prisma.consulta.count.mockResolvedValue(1);

    await expect(service.remover(1)).rejects.toThrow(ConflictException);
    expect(prisma.paciente.delete).not.toHaveBeenCalled();
  });
});
