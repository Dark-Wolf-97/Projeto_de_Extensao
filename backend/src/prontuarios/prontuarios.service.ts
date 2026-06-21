import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProntuarioDto } from './dto/create-prontuario.dto';
import { UpdateProntuarioDto } from './dto/update-prontuario.dto';

const INCLUDE = {
  consulta: {
    include: {
      paciente: { select: { id: true, nome: true, cpf: true } },
      medico: { select: { id: true, nome: true, especialidade: true } },
    },
  },
};

@Injectable()
export class ProntuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProntuarioDto, userId: number) {
    const consulta = await this.prisma.consulta.findUnique({
      where: { id: dto.consultaId },
    });
    if (!consulta) throw new NotFoundException('Consulta não encontrada');
    if (consulta.medicoId !== userId)
      throw new ForbiddenException(
        'Você só pode criar prontuários para suas próprias consultas',
      );

    const existente = await this.prisma.prontuario.findUnique({
      where: { consultaId: dto.consultaId },
    });
    if (existente) throw new ConflictException('Já existe um prontuário para esta consulta');

    return this.prisma.prontuario.create({
      data: {
        consultaId: dto.consultaId,
        anamnese: dto.anamnese,
        diagnostico: dto.diagnostico,
        prescricao: dto.prescricao,
        observacoes: dto.observacoes,
      },
      include: INCLUDE,
    });
  }

  findAll(user: { id: number; role: string }) {
    const where = user.role === 'MEDICO' ? { consulta: { medicoId: user.id } } : {};
    return this.prisma.prontuario.findMany({
      where,
      include: INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const prontuario = await this.prisma.prontuario.findUnique({
      where: { id },
      include: INCLUDE,
    });
    if (!prontuario) throw new NotFoundException('Prontuário não encontrado');
    return prontuario;
  }

  async findByConsulta(consultaId: number) {
    const prontuario = await this.prisma.prontuario.findUnique({
      where: { consultaId },
      include: INCLUDE,
    });
    if (!prontuario) throw new NotFoundException('Prontuário não encontrado');
    return prontuario;
  }

  async update(id: number, dto: UpdateProntuarioDto, user: { id: number; role: string }) {
    const prontuario = await this.findOne(id);
    if (user.role === 'MEDICO' && prontuario.consulta.medico.id !== user.id) {
      throw new ForbiddenException('Você só pode editar seus próprios prontuários');
    }
    return this.prisma.prontuario.update({
      where: { id },
      data: dto,
      include: INCLUDE,
    });
  }

  async remove(id: number, user: { id: number; role: string }) {
    const prontuario = await this.findOne(id);
    if (user.role === 'MEDICO' && prontuario.consulta.medico.id !== user.id) {
      throw new ForbiddenException('Você só pode excluir seus próprios prontuários');
    }
    return this.prisma.prontuario.delete({ where: { id } });
  }
}
