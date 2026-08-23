import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
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

  private assertAccess(user: AuthenticatedUser, medicoId: number) {
    const permitted =
      user.role === Role.ADMIN ||
      (user.role === Role.MEDICO && user.id === medicoId);

    if (!permitted) {
      throw new ForbiddenException('Acesso ao prontuário não autorizado');
    }
  }

  async create(dto: CreateProntuarioDto, user: AuthenticatedUser) {
    if (user.role !== Role.ADMIN && user.role !== Role.MEDICO) {
      throw new ForbiddenException('Acesso ao prontuário não autorizado');
    }

    const consulta = await this.prisma.consulta.findUnique({
      where: { id: dto.consultaId },
    });
    if (!consulta) throw new NotFoundException('Consulta não encontrada');
    this.assertAccess(user, consulta.medicoId);

    const existente = await this.prisma.prontuario.findUnique({
      where: { consultaId: dto.consultaId },
    });
    if (existente)
      throw new ConflictException('Já existe um prontuário para esta consulta');

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

  findAll(user: AuthenticatedUser) {
    if (user.role === Role.SECRETARIA) {
      throw new ForbiddenException('Acesso ao prontuário não autorizado');
    }

    const where =
      user.role === Role.MEDICO ? { consulta: { medicoId: user.id } } : {};
    return this.prisma.prontuario.findMany({
      where,
      include: INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, user: AuthenticatedUser) {
    const prontuario = await this.prisma.prontuario.findUnique({
      where: { id },
      include: INCLUDE,
    });
    if (!prontuario) throw new NotFoundException('Prontuário não encontrado');
    this.assertAccess(user, prontuario.consulta.medico.id);
    return prontuario;
  }

  async findByConsulta(consultaId: number, user: AuthenticatedUser) {
    const prontuario = await this.prisma.prontuario.findUnique({
      where: { consultaId },
      include: INCLUDE,
    });
    if (!prontuario) throw new NotFoundException('Prontuário não encontrado');
    this.assertAccess(user, prontuario.consulta.medico.id);
    return prontuario;
  }

  async update(id: number, dto: UpdateProntuarioDto, user: AuthenticatedUser) {
    await this.findOne(id, user);
    return this.prisma.prontuario.update({
      where: { id },
      data: dto,
      include: INCLUDE,
    });
  }

  async remove(id: number, user: AuthenticatedUser) {
    await this.findOne(id, user);
    return this.prisma.prontuario.delete({ where: { id } });
  }
}
