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
  paciente: { select: { id: true, nome: true, cpf: true } },
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

  private validateFutureDateTime(data: string, hora: string) {
    const dataHora = new Date(`${data.split('T')[0]}T${hora}:00`);
    if (dataHora <= new Date()) {
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
    const dataObj = new Date(`${data.split('T')[0]}T${hora}:00`);

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
        data: new Date(`${dto.data.split('T')[0]}T${dto.hora}:00`),
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
        ...(dto.data && { data: new Date(`${dto.data.split('T')[0]}T${hora}:00`) }),
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

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.consulta.delete({ where: { id } });
  }
}
