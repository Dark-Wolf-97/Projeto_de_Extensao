import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StatusConsulta } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsultaDto } from './dto/create-consulta.dto';
import { UpdateConsultaDto } from './dto/update-consulta.dto';

const INCLUDE_CONSULTA = {
  paciente: { select: { id: true, nome: true, cpf: true, telefone: true } },
  medico: { select: { id: true, nome: true, crm: true, especialidade: true } },
  prontuario: { select: { id: true } },
};

@Injectable()
export class ConsultasService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.consulta.findMany({
      include: INCLUDE_CONSULTA,
      orderBy: [{ data: 'asc' }, { hora: 'asc' }],
    });
  }

  findByMedico(medicoId: number) {
    return this.prisma.consulta.findMany({
      where: { medicoId },
      include: INCLUDE_CONSULTA,
      orderBy: [{ data: 'asc' }, { hora: 'asc' }],
    });
  }

  async findOne(id: number) {
    const consulta = await this.prisma.consulta.findUnique({
      where: { id },
      include: INCLUDE_CONSULTA,
    });
    if (!consulta) throw new NotFoundException('Consulta não encontrada');
    return consulta;
  }

  private toDateUTC(data: string): Date {
    return new Date(`${data.split('T')[0]}T00:00:00Z`);
  }

  private validateFutureDateTime(data: string, hora: string) {
    const [h, m] = hora.split(':').map(Number);
    const [year, month, day] = data.split('T')[0].split('-').map(Number);
    // Brasília = UTC-3: h:m local = (h+3):m UTC
    const consultaUTC = Date.UTC(year, month - 1, day, h + 3, m);
    if (consultaUTC <= Date.now()) {
      throw new BadRequestException(
        'A data e hora da consulta devem ser no futuro',
      );
    }
  }

  private async checkConflicts(
    pacienteId: number,
    medicoId: number,
    data: string,
    hora: string,
    excludeId?: number,
  ) {
    const dataObj = this.toDateUTC(data);

    const whereBase = { data: dataObj, hora };
    const notSelf = excludeId ? { NOT: { id: excludeId } } : {};

    const [conflitoPaciente, conflitoMedico] = await Promise.all([
      this.prisma.consulta.findFirst({
        where: { pacienteId, ...whereBase, ...notSelf },
      }),
      this.prisma.consulta.findFirst({
        where: { medicoId, ...whereBase, ...notSelf },
      }),
    ]);

    if (conflitoPaciente) {
      throw new ConflictException(
        'Paciente já possui uma consulta marcada nesse horário',
      );
    }
    if (conflitoMedico) {
      throw new ConflictException(
        'Médico já possui uma consulta marcada nesse horário',
      );
    }
  }

  async create(dto: CreateConsultaDto) {
    this.validateFutureDateTime(dto.data, dto.hora);
    await this.checkConflicts(dto.pacienteId, dto.medicoId, dto.data, dto.hora);

    return this.prisma.consulta.create({
      data: {
        pacienteId: dto.pacienteId,
        medicoId: dto.medicoId,
        data: this.toDateUTC(dto.data),
        hora: dto.hora,
        status: dto.status ?? StatusConsulta.AGENDADA,
        observacoes: dto.observacoes,
      },
      include: INCLUDE_CONSULTA,
    });
  }

  async update(id: number, dto: UpdateConsultaDto) {
    const atual = await this.findOne(id);

    const data = dto.data ?? atual.data.toISOString();
    const hora = dto.hora ?? atual.hora;
    const pacienteId = dto.pacienteId ?? atual.pacienteId;
    const medicoId = dto.medicoId ?? atual.medicoId;

    if (dto.data || dto.hora) {
      this.validateFutureDateTime(data, hora);
    }

    await this.checkConflicts(pacienteId, medicoId, data, hora, id);

    return this.prisma.consulta.update({
      where: { id },
      data: {
        ...(dto.pacienteId && { pacienteId: dto.pacienteId }),
        ...(dto.medicoId && { medicoId: dto.medicoId }),
        ...(dto.data && { data: this.toDateUTC(dto.data) }),
        ...(dto.hora && { hora: dto.hora }),
        ...(dto.status && { status: dto.status }),
        ...(dto.observacoes !== undefined && { observacoes: dto.observacoes }),
      },
      include: INCLUDE_CONSULTA,
    });
  }

  async realizar(id: number, medicoId: number) {
    const consulta = await this.findOne(id);
    if (consulta.medicoId !== medicoId) {
      throw new ForbiddenException('Você só pode atualizar suas próprias consultas');
    }
    return this.prisma.consulta.update({
      where: { id },
      data: { status: StatusConsulta.REALIZADA },
      include: INCLUDE_CONSULTA,
    });
  }

  async confirmar(id: number) {
    await this.findOne(id);
    return this.prisma.consulta.update({
      where: { id },
      data: { status: StatusConsulta.CONFIRMADA },
      include: INCLUDE_CONSULTA,
    });
  }

  async cancelar(id: number) {
    await this.findOne(id);
    return this.prisma.consulta.update({
      where: { id },
      data: { status: StatusConsulta.CANCELADA },
      include: INCLUDE_CONSULTA,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.consulta.delete({ where: { id } });
  }
}
