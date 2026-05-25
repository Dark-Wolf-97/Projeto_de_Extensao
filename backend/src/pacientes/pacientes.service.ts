import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';

@Injectable()
export class PacientesService {
  constructor(private prisma: PrismaService) {}

  listar() {
    return this.prisma.paciente.findMany({
      orderBy: {
        nome: 'asc',
      },
    });
  }

  buscar(nome: string) {
    return this.prisma.paciente.findMany({
      where: {
        nome: {
          contains: nome,
        },
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  criar(data: CreatePacienteDto) {
    return this.prisma.paciente.create({
      data: {
        nome: data.nome,
        cpf: data.cpf,
        telefone: data.telefone,
        email: data.email,
        dataNascimento: data.dataNascimento
          ? new Date(data.dataNascimento)
          : null,
      },
    });
  }

  atualizar(
    id: number,
    data: UpdatePacienteDto,
  ) {
    return this.prisma.paciente.update({
      where: { id },
      data: {
        nome: data.nome,
        cpf: data.cpf,
        telefone: data.telefone,
        email: data.email,
        dataNascimento: data.dataNascimento
          ? new Date(data.dataNascimento)
          : null,
      },
    });
  }

  remover(id: number) {
    return this.prisma.paciente.delete({
      where: { id },
    });
  }

  listarAniversariosMes() {
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;

    return this.prisma.paciente.findMany({
      where: {
        dataNascimento: {
          not: null,
        },
      },
    }).then((pacientes) =>
      pacientes
        .filter((p) => {
          const data = new Date(p.dataNascimento!);
          return data.getMonth() + 1 === mesAtual;
        })
        .map((p) => ({
          id: p.id,
          nome: p.nome,
          dataNascimento: p.dataNascimento,
          telefone: p.telefone,
        }))
    );
  }
}