import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { StatusConsulta } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleCalendarService } from '../google-calendar/google-calendar.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';

@Injectable()
export class PacientesService {
  constructor(
    private prisma: PrismaService,
    private readonly googleCalendar: GoogleCalendarService,
  ) {}

  listar() {
    return this.prisma.paciente.findMany({ orderBy: { nome: 'asc' } });
  }

  buscar(nome: string) {
    return this.prisma.paciente.findMany({
      where: { nome: { contains: nome } },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: number) {
    const paciente = await this.prisma.paciente.findUnique({ where: { id } });
    if (!paciente) throw new NotFoundException('Paciente não encontrado');
    return paciente;
  }

  async findPerfil(id: number) {
    const paciente = await this.prisma.paciente.findUnique({
      where: { id },
      include: {
        consultas: {
          orderBy: { data: 'desc' },
          include: {
            medico: { select: { id: true, nome: true, especialidade: true } },
            prontuario: { select: { id: true } },
          },
        },
      },
    });
    if (!paciente) throw new NotFoundException('Paciente não encontrado');
    return paciente;
  }

  async criar(data: CreatePacienteDto) {
    if (data.cpf) {
      const existente = await this.prisma.paciente.findUnique({
        where: { cpf: data.cpf },
      });
      if (existente)
        throw new ConflictException('CPF já cadastrado para outro paciente');
    }

    return this.prisma.paciente.create({
      data: {
        nome: data.nome,
        cpf: data.cpf,
        telefone: data.telefone,
        dataNascimento: data.dataNascimento
          ? new Date(data.dataNascimento)
          : null,
        convenio: data.convenio,
      },
    });
  }

  async atualizar(id: number, data: UpdatePacienteDto) {
    await this.findOne(id);

    if (data.cpf) {
      const existente = await this.prisma.paciente.findFirst({
        where: { cpf: data.cpf, NOT: { id } },
      });
      if (existente)
        throw new ConflictException('CPF já cadastrado para outro paciente');
    }

    return this.prisma.paciente.update({
      where: { id },
      data: {
        nome: data.nome,
        cpf: data.cpf,
        telefone: data.telefone,
        dataNascimento: data.dataNascimento
          ? new Date(data.dataNascimento)
          : null,
        convenio: data.convenio,
      },
    });
  }

  async contarConsultasVinculadas(
    id: number,
  ): Promise<{ total: number; ativas: number }> {
    await this.findOne(id);
    const [total, ativas] = await Promise.all([
      this.prisma.consulta.count({ where: { pacienteId: id } }),
      this.prisma.consulta.count({
        where: {
          pacienteId: id,
          status: { in: [StatusConsulta.AGENDADA, StatusConsulta.CONFIRMADA] },
        },
      }),
    ]);
    return { total, ativas };
  }

  async remover(id: number) {
    await this.findOne(id);

    const consultasAtivas = await this.prisma.consulta.count({
      where: {
        pacienteId: id,
        status: { in: [StatusConsulta.AGENDADA, StatusConsulta.CONFIRMADA] },
      },
    });
    if (consultasAtivas > 0) {
      throw new ConflictException(
        'Não é possível excluir o paciente porque existem consultas agendadas ou confirmadas vinculadas a ele. Cancele ou finalize essas consultas antes de excluir.',
      );
    }

    // A esta altura só restam consultas canceladas ou realizadas. Excluir o
    // paciente apaga em cascata essas consultas, seus prontuários e as
    // mensagens vinculadas (histórico clínico completo). Os eventos do
    // Google Calendar de cada consulta são removidos aqui, pois a exclusão
    // em cascata acontece direto no banco, sem passar pelo ConsultasService.
    const consultas = await this.prisma.consulta.findMany({
      where: { pacienteId: id },
      select: { googleCalendarEventId: true },
    });
    for (const consulta of consultas) {
      await this.googleCalendar.removerEventoSemInterromperPortal(
        consulta.googleCalendarEventId,
      );
    }

    return this.prisma.paciente.delete({ where: { id } });
  }

  listarAniversariosMes() {
    const mesAtual = new Date().getMonth() + 1;
    return this.prisma.paciente
      .findMany({ where: { dataNascimento: { not: null } } })
      .then((pacientes) =>
        pacientes
          .filter(
            (p) => new Date(p.dataNascimento!).getMonth() + 1 === mesAtual,
          )
          .map((p) => ({
            id: p.id,
            nome: p.nome,
            dataNascimento: p.dataNascimento,
            telefone: p.telefone,
          })),
      );
  }
}
