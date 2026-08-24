import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, StatusConsulta } from '@prisma/client';
import { ConsultasService } from './consultas.service';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleCalendarService } from '../google-calendar/google-calendar.service';
import { MensagensService } from '../mensagens/mensagens.service';

const AMANHA = new Date();
AMANHA.setDate(AMANHA.getDate() + 1);
const DATA_FUTURA = AMANHA.toISOString().split('T')[0];
const HORA = '10:00';

const DATA_PASSADA = '2020-01-01';

const mockPaciente = { id: 1, nome: 'Maria Silva', cpf: '123.456.789-00' };
const mockMedico = {
  id: 2,
  nome: 'Dr. Carlos',
  crm: 'CRM-SP-1234',
  especialidade: 'Clínica Geral',
};

const mockConsulta = {
  id: 1,
  pacienteId: 1,
  medicoId: 2,
  data: new Date(`${DATA_FUTURA}T${HORA}:00`),
  hora: HORA,
  status: StatusConsulta.AGENDADA,
  observacoes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  paciente: mockPaciente,
  medico: mockMedico,
};

const mockPrisma = {
  consulta: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const mockGoogleCalendar = {
  sincronizarSemInterromperPortal: jest.fn(),
  removerEventoSemInterromperPortal: jest.fn(),
  cadastrarOuRecadastrar: jest.fn(),
  buscarLinkAgenda: jest.fn(),
};

const mockMensagens = {
  agendarConfirmacao: jest.fn(),
};

describe('ConsultasService', () => {
  let service: ConsultasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsultasService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GoogleCalendarService, useValue: mockGoogleCalendar },
        { provide: MensagensService, useValue: mockMensagens },
      ],
    }).compile();

    service = module.get<ConsultasService>(ConsultasService);
  });

  afterEach(() => jest.clearAllMocks());

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  it('deve sincronizar a agenda sem interromper a criação da consulta', async () => {
    mockPrisma.consulta.findFirst.mockResolvedValue(null);
    mockPrisma.consulta.create.mockResolvedValue(mockConsulta);

    await service.create({
      pacienteId: 1,
      medicoId: 2,
      data: DATA_FUTURA,
      hora: HORA,
    });

    expect(
      mockGoogleCalendar.sincronizarSemInterromperPortal,
    ).toHaveBeenCalledWith(mockConsulta.id);
  });

  it('deve agendar a mensagem de confirmação sem interromper a criação da consulta', async () => {
    mockPrisma.consulta.findFirst.mockResolvedValue(null);
    mockPrisma.consulta.create.mockResolvedValue(mockConsulta);

    await service.create({
      pacienteId: 1,
      medicoId: 2,
      data: DATA_FUTURA,
      hora: HORA,
    });

    expect(mockMensagens.agendarConfirmacao).toHaveBeenCalledWith(
      mockConsulta.id,
    );
  });

  it('não deve quebrar a criação da consulta quando o agendamento da mensagem falha', async () => {
    mockPrisma.consulta.findFirst.mockResolvedValue(null);
    mockPrisma.consulta.create.mockResolvedValue(mockConsulta);
    mockMensagens.agendarConfirmacao.mockRejectedValueOnce(
      new Error('falha ao agendar mensagem'),
    );

    await expect(
      service.create({
        pacienteId: 1,
        medicoId: 2,
        data: DATA_FUTURA,
        hora: HORA,
      }),
    ).resolves.toEqual(mockConsulta);
  });

  // ─── findAll ───────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('deve retornar todas as consultas ordenadas por data e hora', async () => {
      mockPrisma.consulta.findMany.mockResolvedValue([mockConsulta]);

      const result = await service.findAll();

      expect(mockPrisma.consulta.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ data: 'asc' }, { hora: 'asc' }],
        }),
      );
      expect(result).toHaveLength(1);
    });
  });

  // ─── findByMedico ──────────────────────────────────────────────────────────

  describe('findByMedico()', () => {
    it('deve filtrar consultas pelo medicoId', async () => {
      mockPrisma.consulta.findMany.mockResolvedValue([mockConsulta]);

      await service.findByMedico(2);

      expect(mockPrisma.consulta.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { medicoId: 2 } }),
      );
    });
  });

  // ─── findOne ───────────────────────────────────────────────────────────────

  describe('findOne()', () => {
    it('deve retornar a consulta quando encontrada', async () => {
      mockPrisma.consulta.findUnique.mockResolvedValue(mockConsulta);

      const result = await service.findOne(1);

      expect(mockPrisma.consulta.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
      expect(result.id).toBe(1);
    });

    it('deve lançar NotFoundException quando consulta não existe', async () => {
      mockPrisma.consulta.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create()', () => {
    const dto = { pacienteId: 1, medicoId: 2, data: DATA_FUTURA, hora: HORA };

    it('deve criar consulta com data futura válida', async () => {
      mockPrisma.consulta.findFirst.mockResolvedValue(null);
      mockPrisma.consulta.create.mockResolvedValue(mockConsulta);

      const result = await service.create(dto);

      expect(mockPrisma.consulta.create).toHaveBeenCalled();
      expect(result).toEqual(mockConsulta);
    });

    it('deve usar status AGENDADA quando não informado', async () => {
      mockPrisma.consulta.findFirst.mockResolvedValue(null);
      mockPrisma.consulta.create.mockResolvedValue(mockConsulta);

      await service.create(dto);

      expect(mockPrisma.consulta.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: StatusConsulta.AGENDADA }),
        }),
      );
    });

    it('deve lançar BadRequestException para data no passado', async () => {
      await expect(
        service.create({ ...dto, data: DATA_PASSADA }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.consulta.create).not.toHaveBeenCalled();
    });

    it('deve lançar ConflictException com mensagem de paciente quando há conflito de paciente', async () => {
      // Promise.all chama findFirst 2x; primeira = paciente, segunda = médico
      mockPrisma.consulta.findFirst
        .mockResolvedValueOnce(mockConsulta) // conflito paciente
        .mockResolvedValueOnce(null); // sem conflito médico

      await expect(service.create(dto)).rejects.toThrow(/paciente/i);
    });

    it('deve lançar ConflictException com mensagem de médico quando há conflito de médico', async () => {
      mockPrisma.consulta.findFirst
        .mockResolvedValueOnce(null) // sem conflito paciente
        .mockResolvedValueOnce(mockConsulta); // conflito médico

      await expect(service.create(dto)).rejects.toThrow(/médico/i);
    });

    it('não deve criar quando há conflito, antes de chamar prisma.create', async () => {
      mockPrisma.consulta.findFirst.mockResolvedValue(mockConsulta);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(mockPrisma.consulta.create).not.toHaveBeenCalled();
    });
  });

  // ─── update ────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('deve atualizar status sem validar data futura', async () => {
      mockPrisma.consulta.findUnique.mockResolvedValue(mockConsulta);
      mockPrisma.consulta.findFirst.mockResolvedValue(null);
      mockPrisma.consulta.update.mockResolvedValue({
        ...mockConsulta,
        status: StatusConsulta.CONFIRMADA,
      });

      const result = await service.update(1, {
        status: StatusConsulta.CONFIRMADA,
      });

      expect(mockPrisma.consulta.update).toHaveBeenCalled();
      expect(result.status).toBe(StatusConsulta.CONFIRMADA);
    });

    it('deve lançar BadRequestException ao alterar para data no passado', async () => {
      mockPrisma.consulta.findUnique.mockResolvedValue(mockConsulta);

      await expect(service.update(1, { data: DATA_PASSADA })).rejects.toThrow(
        BadRequestException,
      );

      expect(mockPrisma.consulta.update).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando consulta não existe', async () => {
      mockPrisma.consulta.findUnique.mockResolvedValue(null);

      await expect(
        service.update(999, { status: StatusConsulta.CANCELADA }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve verificar conflitos ao alterar horário', async () => {
      mockPrisma.consulta.findUnique.mockResolvedValue(mockConsulta);
      mockPrisma.consulta.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockConsulta); // conflito médico

      await expect(
        service.update(1, { hora: '14:00', data: DATA_FUTURA }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── realizar ──────────────────────────────────────────────────────────────

  describe('realizar()', () => {
    it('deve permitir que ADMIN marque como realizada uma consulta de qualquer médico', async () => {
      mockPrisma.consulta.findUnique.mockResolvedValue(mockConsulta);
      mockPrisma.consulta.update.mockResolvedValue({
        ...mockConsulta,
        status: StatusConsulta.REALIZADA,
      });

      await service.realizar(1, {
        id: 1,
        email: 'admin@clinica.test',
        role: Role.ADMIN,
      });

      expect(mockPrisma.consulta.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: StatusConsulta.REALIZADA },
        }),
      );
    });

    it('deve negar que médico marque consulta de outro profissional como realizada', async () => {
      mockPrisma.consulta.findUnique.mockResolvedValue(mockConsulta);

      await expect(
        service.realizar(1, {
          id: 3,
          email: 'outro-medico@clinica.test',
          role: Role.MEDICO,
        }),
      ).rejects.toThrow('Você só pode atualizar suas próprias consultas');

      expect(mockPrisma.consulta.update).not.toHaveBeenCalled();
    });
  });

  // ─── remove ────────────────────────────────────────────────────────────────

  describe('remove()', () => {
    it('deve remover a consulta quando encontrada', async () => {
      mockPrisma.consulta.findUnique.mockResolvedValue(mockConsulta);
      mockPrisma.consulta.delete.mockResolvedValue(mockConsulta);

      await service.remove(1);

      expect(mockPrisma.consulta.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('deve lançar NotFoundException quando consulta não existe', async () => {
      mockPrisma.consulta.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.consulta.delete).not.toHaveBeenCalled();
    });

    it('deve lançar ConflictException quando consulta possui prontuário', async () => {
      mockPrisma.consulta.findUnique.mockResolvedValue({
        ...mockConsulta,
        prontuario: { id: 10 },
      });

      await expect(service.remove(1)).rejects.toThrow(ConflictException);
      expect(mockPrisma.consulta.delete).not.toHaveBeenCalled();
    });
  });
});
