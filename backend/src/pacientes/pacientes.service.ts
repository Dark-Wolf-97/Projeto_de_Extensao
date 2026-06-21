import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';

@Injectable()
export class PacientesService {
  constructor(private prisma: PrismaService) {}

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
    const existente = await this.prisma.paciente.findUnique({ where: { cpf: data.cpf } });
    if (existente) throw new ConflictException('CPF já cadastrado para outro paciente');

    return this.prisma.paciente.create({
      data: {
        nome: data.nome,
        cpf: data.cpf,
        telefone: data.telefone,
        dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : null,
      },
    });
  }

  async atualizar(id: number, data: UpdatePacienteDto) {
    await this.findOne(id);

    if (data.cpf) {
      const existente = await this.prisma.paciente.findFirst({
        where: { cpf: data.cpf, NOT: { id } },
      });
      if (existente) throw new ConflictException('CPF já cadastrado para outro paciente');
    }

    return this.prisma.paciente.update({
      where: { id },
      data: {
        nome: data.nome,
        cpf: data.cpf,
        telefone: data.telefone,
        dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : null,
      },
    });
  }

  async remover(id: number) {
    await this.findOne(id);
    return this.prisma.paciente.delete({ where: { id } });
  }

  listarAniversariosMes() {
    const mesAtual = new Date().getMonth() + 1;
    return this.prisma.paciente
      .findMany({ where: { dataNascimento: { not: null } } })
      .then((pacientes) =>
        pacientes
          .filter((p) => new Date(p.dataNascimento!).getMonth() + 1 === mesAtual)
          .map((p) => ({
            id: p.id,
            nome: p.nome,
            dataNascimento: p.dataNascimento,
            telefone: p.telefone,
          })),
      );
  }
}
