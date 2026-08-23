import {
  BadGatewayException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { StatusConsulta } from '@prisma/client';
import type { calendar_v3 } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service';
import {
  GOOGLE_CALENDAR_CLIENT_FACTORY,
  GoogleCalendarClientFactory,
} from './google-calendar.constants';

const DEFAULT_TIMEZONE = 'America/Sao_Paulo';
const DEFAULT_DURATION_MINUTES = 30;
const GOOGLE_CALENDAR_URL = 'https://calendar.google.com/calendar/u/0/r';

const CONSULTA_INCLUDE = {
  paciente: {
    select: {
      id: true,
      nome: true,
      cpf: true,
      telefone: true,
    },
  },
  medico: {
    select: {
      id: true,
      nome: true,
      crm: true,
      especialidade: true,
      telefone: true,
    },
  },
  prontuario: { select: { id: true } },
};

interface GoogleCalendarConfig {
  enabled: boolean;
  calendarId: string;
  serviceAccountEmail: string;
  serviceAccountPrivateKey: string;
  timezone: string;
  durationMinutes: number;
}

interface ErrorWithResponseStatus {
  response?: { status?: unknown };
  code?: unknown;
}

@Injectable()
export class GoogleCalendarService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(GOOGLE_CALENDAR_CLIENT_FACTORY)
    private readonly createClient: GoogleCalendarClientFactory,
  ) {}

  async cadastrarOuRecadastrar(consultaId: number) {
    const config = this.getConfig();
    this.assertSyncConfigured(config);

    const consulta = await this.prisma.consulta.findUnique({
      where: { id: consultaId },
      include: CONSULTA_INCLUDE,
    });

    if (!consulta) {
      throw new NotFoundException('Consulta não encontrada');
    }

    try {
      const client = this.createClient({
        serviceAccountEmail: config.serviceAccountEmail,
        serviceAccountPrivateKey: config.serviceAccountPrivateKey,
      });
      const requestBody = this.buildEvent(consulta, config);
      let event: calendar_v3.Schema$Event | undefined;

      if (consulta.googleCalendarEventId) {
        try {
          const response = await client.events.update({
            calendarId: config.calendarId,
            eventId: consulta.googleCalendarEventId,
            requestBody,
          });
          event = response.data;
        } catch (error) {
          if (!this.isMissingEvent(error)) {
            throw error;
          }
        }
      }

      if (!event) {
        const response = await client.events.insert({
          calendarId: config.calendarId,
          requestBody,
        });
        event = response.data;
      }

      if (!event.id || !event.htmlLink) {
        throw new Error('Resposta incompleta do Google Agenda');
      }

      return await this.prisma.consulta.update({
        where: { id: consultaId },
        data: {
          googleCalendarEventId: event.id,
          googleCalendarEventLink: event.htmlLink,
          googleCalendarSyncedAt: new Date(),
          googleCalendarLastError: null,
        },
        include: CONSULTA_INCLUDE,
      });
    } catch (error) {
      await this.saveErrorWithoutSensitiveData(consultaId, error);
      throw new BadGatewayException(
        'Não foi possível cadastrar a consulta no Google Agenda. Tente novamente mais tarde.' +
          (error instanceof Error ? ` Detalhes: ${error.message}` : ''),
      );
    }
  }

  async sincronizarSemInterromperPortal(consultaId: number): Promise<void> {
    if (!this.getConfig().enabled) return;

    try {
      await this.cadastrarOuRecadastrar(consultaId);
    } catch {
      // A indisponibilidade do Google Agenda nunca impede o CRUD do Portal.
    }
  }

  async removerEventoSemInterromperPortal(
    eventId: string | null,
  ): Promise<void> {
    const config = this.getConfig();
    if (!config.enabled || !eventId) return;

    try {
      this.assertSyncConfigured(config);
      const client = this.createClient({
        serviceAccountEmail: config.serviceAccountEmail,
        serviceAccountPrivateKey: config.serviceAccountPrivateKey,
      });
      await client.events.delete({
        calendarId: config.calendarId,
        eventId,
      });
    } catch {
      // A consulta já foi removida do Portal; falha externa não deve quebrar o CRUD.
    }
  }

  buscarLinkAgenda(): { link: string } {
    const config = this.getConfig();
    if (!config.enabled) {
      throw new ServiceUnavailableException(
        'A integração com Google Agenda está desabilitada.',
      );
    }
    if (!config.calendarId) {
      throw new ServiceUnavailableException(
        'O Google Agenda ainda não foi configurado no servidor.',
      );
    }

    return {
      link: `${GOOGLE_CALENDAR_URL}?cid=${encodeURIComponent(config.calendarId)}`,
    };
  }

  private getConfig(): GoogleCalendarConfig {
    const rawDuration = Number(
      process.env.GOOGLE_CALENDAR_DEFAULT_DURATION_MINUTES,
    );

    return {
      enabled: /^(true|1)$/i.test(
        process.env.GOOGLE_CALENDAR_ENABLED?.trim() ?? '',
      ),
      calendarId: process.env.GOOGLE_CALENDAR_ID?.trim() ?? '',
      serviceAccountEmail:
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() ?? '',
      serviceAccountPrivateKey: (
        process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? ''
      ).replace(/\\n/g, '\n'),
      timezone:
        process.env.GOOGLE_CALENDAR_TIMEZONE?.trim() || DEFAULT_TIMEZONE,
      durationMinutes:
        Number.isInteger(rawDuration) && rawDuration > 0
          ? rawDuration
          : DEFAULT_DURATION_MINUTES,
    };
  }

  private assertSyncConfigured(config: GoogleCalendarConfig): void {
    if (!config.enabled) {
      throw new ServiceUnavailableException(
        'A integração com Google Agenda está desabilitada.',
      );
    }
    if (
      !config.calendarId ||
      !config.serviceAccountEmail ||
      !config.serviceAccountPrivateKey
    ) {
      throw new ServiceUnavailableException(
        'O Google Agenda ainda não foi configurado no servidor.',
      );
    }
  }

  private buildEvent(
    consulta: {
      id: number;
      data: Date;
      hora: string;
      status: StatusConsulta;
      observacoes: string | null;
      createdAt: Date;
      updatedAt: Date;
      paciente: {
        id: number;
        nome: string;
        cpf: string;
        telefone: string;
      };
      medico: {
        id: number;
        nome: string;
        crm: string | null;
        especialidade: string | null;
        telefone: string | null;
      };
      prontuario: { id: number } | null;
    },
    config: GoogleCalendarConfig,
  ): calendar_v3.Schema$Event {
    const date = consulta.data.toISOString().slice(0, 10);
    const startDateTime = `${date}T${consulta.hora}:00`;
    const endDateTime = this.addMinutes(
      date,
      consulta.hora,
      config.durationMinutes,
    );

    return {
      summary: `[Portal] ${this.firstName(consulta.medico.nome)} - ${this.firstName(consulta.paciente.nome)}`,
      description: [
        'Consulta do Portal ISG',
        `ID da consulta: ${consulta.id}`,
        `Paciente: ${consulta.paciente.nome}`,
        `CPF: ${consulta.paciente.cpf}`,
        `WhatsApp/telefone do paciente: ${consulta.paciente.telefone}`,
        `Médico: ${consulta.medico.nome}`,
        `CRM: ${consulta.medico.crm ?? 'Não informado'}`,
        `Especialidade: ${consulta.medico.especialidade ?? 'Não informada'}`,
        `Telefone do médico: ${consulta.medico.telefone ?? 'Não informado'}`,
        `Data: ${this.formatDate(date)}`,
        `Hora: ${consulta.hora}`,
        `Status: ${this.statusLabel(consulta.status)}`,
        `Observações: ${consulta.observacoes || 'Não informadas'}`,
        `Prontuário: ${consulta.prontuario ? `#${consulta.prontuario.id}` : 'Não registrado'}`,
        `Criada em: ${consulta.createdAt.toISOString()}`,
        `Atualizada em: ${consulta.updatedAt.toISOString()}`,
      ].join('\n'),
      start: {
        dateTime: startDateTime,
        timeZone: config.timezone,
      },
      end: {
        dateTime: endDateTime,
        timeZone: config.timezone,
      },
    };
  }

  private firstName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    const withoutTitle = parts.filter(
      (part, index) => index > 0 || !/^(dr|dra)\.?$/i.test(part),
    );
    return withoutTitle[0] || parts[0] || '';
  }

  private formatDate(date: string): string {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }

  private statusLabel(status: StatusConsulta): string {
    return {
      [StatusConsulta.AGENDADA]: 'Agendada',
      [StatusConsulta.CONFIRMADA]: 'Confirmada',
      [StatusConsulta.REALIZADA]: 'Realizada',
      [StatusConsulta.CANCELADA]: 'Cancelada',
    }[status];
  }

  private addMinutes(date: string, time: string, minutes: number): string {
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    const result = new Date(
      Date.UTC(year, month - 1, day, hour, minute + minutes),
    );
    return result.toISOString().slice(0, 19);
  }

  private isMissingEvent(error: unknown): boolean {
    const status = this.errorStatus(error);
    return status === 404 || status === 410;
  }

  private errorStatus(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null) return undefined;
    const candidate = error as ErrorWithResponseStatus;
    const responseStatus = candidate.response?.status;
    const code = candidate.code;

    if (typeof responseStatus === 'number') return responseStatus;
    if (typeof code === 'number') return code;
    if (typeof code === 'string' && /^\d{3}$/.test(code)) return Number(code);
    return undefined;
  }

  private async saveErrorWithoutSensitiveData(
    consultaId: number,
    error: unknown,
  ): Promise<void> {
    const status = this.errorStatus(error);
    let safeMessage = 'Falha ao sincronizar com o Google Agenda.';

    if (status === 401 || status === 403) {
      safeMessage = 'Google Agenda recusou a autenticação ou a permissão.';
    } else if (status === 429) {
      safeMessage = 'Limite temporário da API do Google Agenda atingido.';
    } else if (status && status >= 500) {
      safeMessage = 'Google Agenda temporariamente indisponível.';
    }

    try {
      await this.prisma.consulta.update({
        where: { id: consultaId },
        data: { googleCalendarLastError: safeMessage },
      });
    } catch {
      // Mantém o erro amigável mesmo se não for possível persistir o diagnóstico.
    }
  }
}
