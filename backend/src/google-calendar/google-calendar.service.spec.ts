import {
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StatusConsulta } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  GOOGLE_CALENDAR_CLIENT_FACTORY,
  GoogleCalendarClient,
  GoogleCalendarClientFactory,
} from './google-calendar.constants';
import { GoogleCalendarService } from './google-calendar.service';

const PRIVATE_KEY = 'SEGREDO-NAO-PODE-VAZAR';
const CALENDAR_ID = 'agenda@group.calendar.google.com';

const consulta = {
  id: 15,
  pacienteId: 1,
  medicoId: 2,
  data: new Date('2027-10-20T00:00:00.000Z'),
  hora: '14:30',
  status: StatusConsulta.CONFIRMADA,
  observacoes: 'Retorno com exames',
  googleCalendarEventId: null,
  googleCalendarEventLink: null,
  googleCalendarSyncedAt: null,
  googleCalendarLastError: null,
  createdAt: new Date('2027-09-01T10:00:00.000Z'),
  updatedAt: new Date('2027-09-02T11:00:00.000Z'),
  paciente: {
    id: 1,
    nome: 'Maria Silva',
    cpf: '123.456.789-00',
    telefone: '(42) 99999-0000',
  },
  medico: {
    id: 2,
    nome: 'Dr. Carlos Souza',
    crm: 'CRM-1234',
    especialidade: 'Cardiologia',
    telefone: '(42) 3333-4444',
  },
  prontuario: { id: 99 },
};

const mockPrisma = {
  consulta: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const insert = jest.fn();
const update = jest.fn();
const remove = jest.fn();
const calendarClient: GoogleCalendarClient = {
  events: { insert, update, delete: remove },
};
const clientFactory: jest.MockedFunction<GoogleCalendarClientFactory> = jest
  .fn()
  .mockReturnValue(calendarClient);

const ENV_KEYS = [
  'GOOGLE_CALENDAR_ENABLED',
  'GOOGLE_CALENDAR_ID',
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY',
  'GOOGLE_CALENDAR_TIMEZONE',
  'GOOGLE_CALENDAR_DEFAULT_DURATION_MINUTES',
] as const;

const originalEnv = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
);

describe('GoogleCalendarService', () => {
  let service: GoogleCalendarService;

  beforeEach(async () => {
    process.env.GOOGLE_CALENDAR_ENABLED = 'true';
    process.env.GOOGLE_CALENDAR_ID = CALENDAR_ID;
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL =
      'portal@projeto.iam.gserviceaccount.com';
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = PRIVATE_KEY;
    process.env.GOOGLE_CALENDAR_TIMEZONE = 'America/Sao_Paulo';
    process.env.GOOGLE_CALENDAR_DEFAULT_DURATION_MINUTES = '30';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleCalendarService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: GOOGLE_CALENDAR_CLIENT_FACTORY,
          useValue: clientFactory,
        },
      ],
    }).compile();

    service = module.get(GoogleCalendarService);
    mockPrisma.consulta.findUnique.mockResolvedValue(consulta);
    mockPrisma.consulta.update.mockImplementation(({ data }) =>
      Promise.resolve({ ...consulta, ...data }),
    );
    insert.mockResolvedValue({
      data: {
        id: 'evento-novo',
        htmlLink: 'https://calendar.google.com/event?eid=novo',
      },
    });
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(() => {
    for (const key of ENV_KEYS) {
      const value = originalEnv[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('deve criar evento com título exato, WhatsApp e todos os dados da consulta', async () => {
    await service.cadastrarOuRecadastrar(consulta.id);

    const request = insert.mock.calls[0][0];
    expect(request.calendarId).toBe(CALENDAR_ID);
    expect(request.requestBody.summary).toBe('[Portal] Carlos - Maria');
    expect(request.requestBody.description).toContain(
      'WhatsApp/telefone do paciente: (42) 99999-0000',
    );
    expect(request.requestBody.description).toContain('Paciente: Maria Silva');
    expect(request.requestBody.description).toContain('CPF: 123.456.789-00');
    expect(request.requestBody.description).toContain(
      'Médico: Dr. Carlos Souza',
    );
    expect(request.requestBody.description).toContain(
      'Registro profissional: CRM-1234',
    );
    expect(request.requestBody.description).toContain('Data: 20/10/2027');
    expect(request.requestBody.description).toContain('Hora: 14:30');
    expect(request.requestBody.description).toContain('Status: Confirmada');
    expect(request.requestBody.description).toContain(
      'Observações: Retorno com exames',
    );
    expect(request.requestBody.start).toEqual({
      dateTime: '2027-10-20T14:30:00',
      timeZone: 'America/Sao_Paulo',
    });
    expect(request.requestBody.end).toEqual({
      dateTime: '2027-10-20T15:00:00',
      timeZone: 'America/Sao_Paulo',
    });
  });

  it('deve atualizar o evento existente no re-cadastro', async () => {
    mockPrisma.consulta.findUnique.mockResolvedValue({
      ...consulta,
      googleCalendarEventId: 'evento-existente',
    });
    update.mockResolvedValue({
      data: {
        id: 'evento-existente',
        htmlLink: 'https://calendar.google.com/event?eid=existente',
      },
    });

    await service.cadastrarOuRecadastrar(consulta.id);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: 'evento-existente' }),
    );
    expect(insert).not.toHaveBeenCalled();
    expect(mockPrisma.consulta.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ googleCalendarLastError: null }),
      }),
    );
  });

  it('deve recriar o evento quando o evento salvo foi apagado no Google Agenda', async () => {
    mockPrisma.consulta.findUnique.mockResolvedValue({
      ...consulta,
      googleCalendarEventId: 'evento-apagado',
    });
    update.mockRejectedValue({ response: { status: 404 } });

    await expect(service.cadastrarOuRecadastrar(consulta.id)).resolves.toEqual(
      expect.objectContaining({ googleCalendarEventId: 'evento-novo' }),
    );

    expect(insert).toHaveBeenCalledTimes(1);
    expect(mockPrisma.consulta.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          googleCalendarEventId: 'evento-novo',
        }),
      }),
    );
  });

  it('deve aceitar várias consultas no mesmo horário sem consultar conflitos', async () => {
    const segundaConsulta = {
      ...consulta,
      id: 16,
      paciente: { ...consulta.paciente, id: 3, nome: 'Ana Lima' },
      medico: { ...consulta.medico, id: 4, nome: 'Dra. Paula Lima' },
    };
    mockPrisma.consulta.findUnique
      .mockResolvedValueOnce(consulta)
      .mockResolvedValueOnce(segundaConsulta);
    insert
      .mockResolvedValueOnce({
        data: { id: 'evento-1', htmlLink: 'https://calendar/evento-1' },
      })
      .mockResolvedValueOnce({
        data: { id: 'evento-2', htmlLink: 'https://calendar/evento-2' },
      });

    await service.cadastrarOuRecadastrar(consulta.id);
    await service.cadastrarOuRecadastrar(segundaConsulta.id);

    expect(insert).toHaveBeenCalledTimes(2);
  });

  it('deve salvar erro seguro e nunca vazar o segredo quando a API falha', async () => {
    insert.mockRejectedValue({
      response: { status: 403 },
      message: `Credencial inválida: ${PRIVATE_KEY}`,
    });

    let captured: unknown;
    try {
      await service.cadastrarOuRecadastrar(consulta.id);
    } catch (error) {
      captured = error;
    }

    expect(captured).toBeInstanceOf(BadGatewayException);
    expect(String(captured)).not.toContain(PRIVATE_KEY);
    expect(mockPrisma.consulta.update).toHaveBeenCalledWith({
      where: { id: consulta.id },
      data: {
        googleCalendarLastError:
          'Google Agenda recusou a autenticação ou a permissão.',
      },
    });
    expect(JSON.stringify(mockPrisma.consulta.update.mock.calls)).not.toContain(
      PRIVATE_KEY,
    );
  });

  it('não deve quebrar o Portal quando a integração está desabilitada', async () => {
    process.env.GOOGLE_CALENDAR_ENABLED = 'false';

    await expect(
      service.sincronizarSemInterromperPortal(consulta.id),
    ).resolves.toBeUndefined();
    await expect(service.cadastrarOuRecadastrar(consulta.id)).rejects.toThrow(
      ServiceUnavailableException,
    );

    expect(clientFactory).not.toHaveBeenCalled();
    expect(mockPrisma.consulta.findUnique).not.toHaveBeenCalled();
  });

  it('deve fornecer link da agenda sem expor credenciais', () => {
    const result = service.buscarLinkAgenda();

    expect(result.link).toContain('https://calendar.google.com/');
    expect(result.link).toContain(encodeURIComponent(CALENDAR_ID));
    expect(result.link).not.toContain(PRIVATE_KEY);
  });
});
