import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StatusConsulta } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

const SELECT_SAFE = {
  id: true,
  nome: true,
  email: true,
  role: true,
  crm: true,
  especialidade: true,
  telefone: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existe = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existe) throw new ConflictException('E-mail já cadastrado');

    if (dto.crm) {
      const crmExiste = await this.prisma.user.findUnique({
        where: { crm: dto.crm },
      });
      if (crmExiste)
        throw new ConflictException('Registro profissional já cadastrado');
    }

    const senhaHash = await bcrypt.hash(dto.senha, 10);

    return this.prisma.user.create({
      data: {
        nome: dto.nome,
        email: dto.email,
        senha: senhaHash,
        role: dto.role,
        crm: dto.crm,
        especialidade: dto.especialidade,
        telefone: dto.telefone,
      },
      select: SELECT_SAFE,
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      select: SELECT_SAFE,
      orderBy: { nome: 'asc' },
    });
  }

  buscarPorNome(nome: string) {
    return this.prisma.user.findMany({
      where: { nome: { contains: nome } },
      select: SELECT_SAFE,
      orderBy: { nome: 'asc' },
    });
  }

  findMedicos() {
    return this.prisma.user.findMany({
      where: { role: 'MEDICO' },
      select: { id: true, nome: true, crm: true, especialidade: true },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: SELECT_SAFE,
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);

    if (dto.email) {
      const existe = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (existe) throw new ConflictException('E-mail já cadastrado');
    }

    if (dto.crm) {
      const crmExiste = await this.prisma.user.findFirst({
        where: { crm: dto.crm, NOT: { id } },
      });
      if (crmExiste)
        throw new ConflictException('Registro profissional já cadastrado');
    }

    const data: Prisma.UserUpdateInput = {
      nome: dto.nome,
      email: dto.email,
      role: dto.role,
      crm: dto.crm,
      especialidade: dto.especialidade,
      telefone: dto.telefone,
    };

    if (dto.senha) {
      data.senha = await bcrypt.hash(dto.senha, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: SELECT_SAFE,
    });
  }

  async updateMe(userId: number, dto: UpdateUserDto) {
    const { role, ...safeDto } = dto;
    return this.update(userId, safeDto);
  }

  async contarConsultasVinculadas(
    id: number,
  ): Promise<{ total: number; ativas: number }> {
    await this.findOne(id);
    const [total, ativas] = await Promise.all([
      this.prisma.consulta.count({ where: { medicoId: id } }),
      this.prisma.consulta.count({
        where: {
          medicoId: id,
          status: { in: [StatusConsulta.AGENDADA, StatusConsulta.CONFIRMADA] },
        },
      }),
    ]);
    return { total, ativas };
  }

  async remove(id: number) {
    await this.findOne(id);

    const consultasAtivas = await this.prisma.consulta.count({
      where: {
        medicoId: id,
        status: { in: [StatusConsulta.AGENDADA, StatusConsulta.CONFIRMADA] },
      },
    });
    if (consultasAtivas > 0) {
      throw new ConflictException(
        'Não é possível excluir o médico porque existem consultas agendadas ou confirmadas vinculadas a ele. Cancele ou finalize essas consultas antes de excluir.',
      );
    }

    // Excluir o médico apenas desvincula consultas já canceladas/realizadas
    // (medicoId vira null via ON DELETE SET NULL); elas e seus prontuários
    // continuam existindo normalmente.
    return this.prisma.user.delete({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
