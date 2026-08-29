import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StatusConsulta } from '@prisma/client';
import { PacientesService } from './pacientes.service';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleCalendarService } from '../google-calendar/google-calendar.service';

describe('PacientesService', () => {
  let service: PacientesService;
  const prisma = {
    paciente: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    consulta: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };
  const googleCalendar = {
    removerEventoSemInterromperPortal: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PacientesService,
        { provide: PrismaService, useValue: prisma },
        { provide: GoogleCalendarService, useValue: googleCalendar },
      ],
    }).compile();

    service = module.get<PacientesService>(PacientesService);
    prisma.consulta.count.mockResolvedValue(0);
    prisma.consulta.findMany.mockResolvedValue([]);
  });

  afterEach(() => jest.clearAllMocks());

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('remover()', () => {
    it('deve excluir paciente sem consultas vinculadas', async () => {
      prisma.paciente.findUnique.mockResolvedValue({ id: 1, nome: 'Maria' });
      prisma.paciente.delete.mockResolvedValue({ id: 1, nome: 'Maria' });

      await service.remover(1);

      expect(prisma.consulta.count).toHaveBeenCalledWith({
        where: {
          pacienteId: 1,
          status: { in: [StatusConsulta.AGENDADA, StatusConsulta.CONFIRMADA] },
        },
      });
      expect(prisma.consulta.findMany).toHaveBeenCalledWith({
        where: { pacienteId: 1 },
        select: { googleCalendarEventId: true },
      });
      expect(googleCalendar.removerEventoSemInterromperPortal).not.toHaveBeenCalled();
      expect(prisma.paciente.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('deve excluir paciente com consultas canceladas/realizadas, removendo os eventos da agenda de cada uma', async () => {
      prisma.paciente.findUnique.mockResolvedValue({ id: 1, nome: 'Maria' });
      prisma.consulta.findMany.mockResolvedValue([
        { googleCalendarEventId: 'evt-1' },
        { googleCalendarEventId: null },
      ]);
      prisma.paciente.delete.mockResolvedValue({ id: 1, nome: 'Maria' });

      await service.remover(1);

      expect(googleCalendar.removerEventoSemInterromperPortal).toHaveBeenCalledWith('evt-1');
      expect(googleCalendar.removerEventoSemInterromperPortal).toHaveBeenCalledWith(null);
      expect(prisma.paciente.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('deve lançar ConflictException quando o paciente tem consulta agendada ou confirmada', async () => {
      prisma.paciente.findUnique.mockResolvedValue({ id: 1, nome: 'Maria' });
      prisma.consulta.count.mockResolvedValue(1);

      await expect(service.remover(1)).rejects.toThrow(ConflictException);
      expect(prisma.paciente.delete).not.toHaveBeenCalled();
    });
  });

  describe('contarConsultasVinculadas()', () => {
    it('deve retornar o total e as ativas separadamente', async () => {
      prisma.paciente.findUnique.mockResolvedValue({ id: 1, nome: 'Maria' });
      prisma.consulta.count
        .mockResolvedValueOnce(4) // total
        .mockResolvedValueOnce(1); // ativas (agendada/confirmada)

      const result = await service.contarConsultasVinculadas(1);

      expect(prisma.consulta.count).toHaveBeenCalledWith({
        where: { pacienteId: 1 },
      });
      expect(prisma.consulta.count).toHaveBeenCalledWith({
        where: {
          pacienteId: 1,
          status: { in: [StatusConsulta.AGENDADA, StatusConsulta.CONFIRMADA] },
        },
      });
      expect(result).toEqual({ total: 4, ativas: 1 });
    });
  });
});
