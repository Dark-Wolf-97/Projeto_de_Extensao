import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
  forwardRef,
} from '@nestjs/common';
import {
  Mensagem,
  StatusConsulta,
  StatusMensagem,
  TipoMensagem,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { ConsultasService } from '../consultas/consultas.service';

const AFIRMATIVO = /^(sim|s|ok|confirmo|confirmado|confirmar|yes)[.!]?$/;
const JANELA_RESPOSTA_DIAS = 5;

const INCLUDE_FILA = {
  paciente: { select: { id: true, nome: true, telefone: true } },
  consulta: { select: { id: true, data: true, hora: true } },
};

type ConsultaComRelacoes = {
  id: number;
  data: Date;
  hora: string;
  pacienteId: number;
  paciente: { nome: string; telefone: string };
  medico: { nome: string };
};

@Injectable()
export class MensagensService implements OnModuleInit {
  private readonly logger = new Logger(MensagensService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappService,
    @Inject(forwardRef(() => ConsultasService))
    private readonly consultas: ConsultasService,
  ) {}

  onModuleInit(): void {
    this.whatsapp.onInboundMessage((mensagem) => {
      void this.processarMensagemRecebida(mensagem.from, mensagem.body);
    });
  }

  listarPendentes() {
    return this.prisma.mensagem.findMany({
      where: { status: StatusMensagem.PENDENTE },
      include: INCLUDE_FILA,
      orderBy: { agendadoPara: 'asc' },
    });
  }

  listarHistorico() {
    return this.prisma.mensagem.findMany({
      where: {
        status: {
          in: [
            StatusMensagem.ENVIADA,
            StatusMensagem.CANCELADA,
            StatusMensagem.FALHA,
          ],
        },
      },
      include: INCLUDE_FILA,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async editarConteudo(id: number, conteudo: string) {
    const mensagem = await this.obterPendente(id);
    return this.prisma.mensagem.update({
      where: { id: mensagem.id },
      data: { conteudo },
      include: INCLUDE_FILA,
    });
  }

  async cancelar(id: number) {
    const mensagem = await this.obterPendente(id);
    return this.prisma.mensagem.update({
      where: { id: mensagem.id },
      data: { status: StatusMensagem.CANCELADA, canceladoEm: new Date() },
      include: INCLUDE_FILA,
    });
  }

  async enviarAgora(id: number) {
    const mensagem = await this.obterPendente(id);
    await this.enviarUmaMensagem(mensagem, { manual: true });
    return this.prisma.mensagem.findUniqueOrThrow({
      where: { id: mensagem.id },
      include: INCLUDE_FILA,
    });
  }

  async agendarConfirmacao(consultaId: number): Promise<void> {
    const consulta = await this.buscarConsultaParaMensagem(consultaId);
    if (!consulta || !consulta.paciente.telefone) return;

    const existente = await this.prisma.mensagem.findFirst({
      where: { consultaId, tipo: TipoMensagem.CONFIRMACAO },
    });
    if (existente) return;

    await this.prisma.mensagem.create({
      data: {
        tipo: TipoMensagem.CONFIRMACAO,
        pacienteId: consulta.pacienteId,
        consultaId: consulta.id,
        telefone: consulta.paciente.telefone,
        conteudo: this.montarConteudoConfirmacao(consulta),
        agendadoPara: new Date(Date.now() + this.getConfirmacaoDelayMs()),
      },
    });
  }

  async agendarLembretes(): Promise<void> {
    const amanha = this.dataUTCemDias(1);
    const consultas = await this.prisma.consulta.findMany({
      where: {
        data: amanha,
        status: { in: [StatusConsulta.AGENDADA, StatusConsulta.CONFIRMADA] },
      },
      include: {
        paciente: { select: { nome: true, telefone: true } },
        medico: { select: { nome: true } },
      },
    });

    for (const consulta of consultas) {
      if (!consulta.paciente.telefone) continue;

      const existente = await this.prisma.mensagem.findFirst({
        where: { consultaId: consulta.id, tipo: TipoMensagem.LEMBRETE },
      });
      if (existente) continue;

      await this.prisma.mensagem.create({
        data: {
          tipo: TipoMensagem.LEMBRETE,
          pacienteId: consulta.pacienteId,
          consultaId: consulta.id,
          telefone: consulta.paciente.telefone,
          conteudo: this.montarConteudoLembrete(consulta),
          agendadoPara: new Date(),
        },
      });
    }
  }

  async agendarAniversarios(): Promise<void> {
    const hoje = new Date();
    const pacientes = await this.prisma.paciente.findMany({
      where: { dataNascimento: { not: null } },
      select: { id: true, nome: true, telefone: true, dataNascimento: true },
    });

    const aniversariantes = pacientes.filter((paciente) => {
      const nascimento = new Date(paciente.dataNascimento!);
      return (
        nascimento.getUTCMonth() === hoje.getUTCMonth() &&
        nascimento.getUTCDate() === hoje.getUTCDate()
      );
    });

    const inicioAno = new Date(Date.UTC(hoje.getUTCFullYear(), 0, 1));

    for (const paciente of aniversariantes) {
      if (!paciente.telefone) continue;

      const existente = await this.prisma.mensagem.findFirst({
        where: {
          pacienteId: paciente.id,
          tipo: TipoMensagem.ANIVERSARIO,
          createdAt: { gte: inicioAno },
        },
      });
      if (existente) continue;

      await this.prisma.mensagem.create({
        data: {
          tipo: TipoMensagem.ANIVERSARIO,
          pacienteId: paciente.id,
          telefone: paciente.telefone,
          conteudo: this.montarConteudoAniversario(paciente.nome),
          agendadoPara: new Date(),
        },
      });
    }
  }

  async enviarPendentesDevidos(): Promise<void> {
    const agora = new Date();
    const pendentes = await this.prisma.mensagem.findMany({
      where: {
        status: StatusMensagem.PENDENTE,
        agendadoPara: { lte: agora },
      },
      orderBy: { agendadoPara: 'asc' },
    });

    for (const mensagem of pendentes) {
      await this.enviarUmaMensagem(mensagem, { manual: false });
      await this.aguardar(2000);
    }
  }

  async processarMensagemRecebida(from: string, body: string): Promise<void> {
    if (from.endsWith('@g.us')) return;

    const texto = this.normalizarTexto(body);
    if (!AFIRMATIVO.test(texto)) {
      this.logger.debug(
        `Resposta de "${from}" ignorada: texto não bateu com a lista de afirmação`,
      );
      return;
    }

    const remetente = from.replace(/\D/g, '');
    const pacientes = await this.prisma.paciente.findMany({
      where: { telefone: { not: '' } },
      select: { id: true, telefone: true },
    });
    const paciente = pacientes.find((p) =>
      this.candidatosE164(p.telefone).includes(remetente),
    );
    if (!paciente) {
      this.logger.debug(
        `Resposta afirmativa de "${remetente}" ignorada: nenhum paciente com esse telefone`,
      );
      return;
    }

    const desde = new Date(
      Date.now() - JANELA_RESPOSTA_DIAS * 24 * 60 * 60 * 1000,
    );
    const mensagem = await this.prisma.mensagem.findFirst({
      where: {
        pacienteId: paciente.id,
        tipo: { in: [TipoMensagem.CONFIRMACAO, TipoMensagem.LEMBRETE] },
        status: StatusMensagem.ENVIADA,
        enviadoEm: { gte: desde },
        consultaId: { not: null },
        consulta: { status: StatusConsulta.AGENDADA },
      },
      orderBy: { enviadoEm: 'desc' },
    });
    if (!mensagem?.consultaId) {
      this.logger.debug(
        `Resposta afirmativa do paciente ${paciente.id} ignorada: nenhuma consulta agendada com mensagem enviada recente`,
      );
      return;
    }

    this.logger.log(
      `Confirmando consulta ${mensagem.consultaId} por resposta do paciente ${paciente.id} no WhatsApp`,
    );
    await this.consultas.confirmar(mensagem.consultaId);
  }

  private async obterPendente(id: number): Promise<Mensagem> {
    const mensagem = await this.prisma.mensagem.findUnique({ where: { id } });
    if (!mensagem) throw new NotFoundException('Mensagem não encontrada');
    if (mensagem.status !== StatusMensagem.PENDENTE) {
      throw new ConflictException(
        'Só é possível alterar mensagens que ainda estão pendentes',
      );
    }
    return mensagem;
  }

  private async enviarUmaMensagem(
    mensagem: Mensagem,
    opts: { manual: boolean },
  ): Promise<void> {
    try {
      const { whatsappMessageId } = await this.whatsapp.enviarTexto(
        this.paraE164(mensagem.telefone),
        mensagem.conteudo,
      );
      await this.prisma.mensagem.update({
        where: { id: mensagem.id },
        data: {
          status: StatusMensagem.ENVIADA,
          enviadoEm: new Date(),
          whatsappMessageId,
          erro: null,
        },
      });
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        if (opts.manual) throw error;
        return;
      }
      this.logger.error(
        `Falha ao enviar mensagem ${mensagem.id} pelo WhatsApp`,
        error instanceof Error ? error.stack : error,
      );
      await this.prisma.mensagem.update({
        where: { id: mensagem.id },
        data: {
          status: StatusMensagem.FALHA,
          erro: 'Falha ao enviar mensagem pelo WhatsApp.',
        },
      });
      if (opts.manual) throw error;
    }
  }

  private buscarConsultaParaMensagem(
    consultaId: number,
  ): Promise<ConsultaComRelacoes | null> {
    return this.prisma.consulta.findUnique({
      where: { id: consultaId },
      include: {
        paciente: { select: { nome: true, telefone: true } },
        medico: { select: { nome: true } },
      },
    });
  }

  private montarConteudoConfirmacao(consulta: ConsultaComRelacoes): string {
    return `Olá, ${consulta.paciente.nome}! Sua consulta com ${consulta.medico.nome} está agendada para ${this.formatarData(consulta.data)} às ${consulta.hora}. Responda SIM para confirmar sua presença.`;
  }

  private montarConteudoLembrete(consulta: ConsultaComRelacoes): string {
    return `Olá, ${consulta.paciente.nome}! Lembrete: sua consulta com ${consulta.medico.nome} é amanhã, ${this.formatarData(consulta.data)} às ${consulta.hora}. Responda SIM para confirmar sua presença.`;
  }

  private montarConteudoAniversario(nome: string): string {
    return `Olá, ${nome}! A equipe da clínica deseja um feliz aniversário e muita saúde!`;
  }

  private formatarData(data: Date): string {
    const [ano, mes, dia] = data.toISOString().slice(0, 10).split('-');
    return `${dia}/${mes}/${ano}`;
  }

  private dataUTCemDias(dias: number): Date {
    const hoje = new Date();
    return new Date(
      Date.UTC(
        hoje.getUTCFullYear(),
        hoje.getUTCMonth(),
        hoje.getUTCDate() + dias,
      ),
    );
  }

  private paraE164(telefoneArmazenado: string): string {
    const digitos = telefoneArmazenado.replace(/\D/g, '');
    return digitos.startsWith('55') ? digitos : `55${digitos}`;
  }

  private candidatosE164(telefoneArmazenado: string): string[] {
    const digitos = telefoneArmazenado.replace(/\D/g, '');
    const semPrefixo = digitos.startsWith('55') ? digitos.slice(2) : digitos;
    const ddd = semPrefixo.slice(0, 2);
    const numero = semPrefixo.slice(2);
    const variantes = new Set<string>([numero]);
    if (numero.length === 9) variantes.add(numero.slice(1));
    if (numero.length === 8) variantes.add(`9${numero}`);
    return [...variantes].map((variante) => `55${ddd}${variante}`);
  }

  private normalizarTexto(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  private aguardar(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getConfirmacaoDelayMs(): number {
    const minutos = Number(process.env.WHATSAPP_CONFIRMACAO_DELAY_MINUTES);
    const minutosValidos =
      Number.isFinite(minutos) && minutos >= 0 ? minutos : 3;
    return minutosValidos * 60_000;
  }
}
