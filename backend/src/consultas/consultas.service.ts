import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsultaDto } from './dto/create-consulta.dto';
import { UpdateConsultaDto } from './dto/update-consulta.dto';

@Injectable()
export class ConsultasService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.consulta
      .findMany({
        include: {
          paciente: true,
        },
      })
      .then((consultas) =>
        consultas.map((c) => ({
          id: c.id,
          data: c.data,
          hora: c.hora,
          medico: c.medico,
          status: c.status,
          observacoes: c.observacoes,
          pacienteId: c.pacienteId,
          pacienteNome: c.paciente?.nome,
        })),
      );
  }

  create(dto: CreateConsultaDto) {
    return this.prisma.consulta.create({
      data: {
        data: new Date(dto.data),
        hora: dto.hora,
        medico: dto.medico,
        observacoes: dto.observacoes,
        status: dto.status ?? 'Agendada',
        pacienteId: Number(dto.pacienteId),
      },
    });
  }

  update(id: number, dto: UpdateConsultaDto) {
    return this.prisma.consulta.update({
      where: { id },
      data: {
        ...(dto.data && { data: new Date(dto.data) }),
        ...(dto.hora && { hora: dto.hora }),
        ...(dto.medico !== undefined && { medico: dto.medico }),
        ...(dto.observacoes !== undefined && { observacoes: dto.observacoes }),
        ...(dto.status && { status: dto.status }),
        ...(dto.pacienteId && { pacienteId: Number(dto.pacienteId) }),
      },
    });
  }

  remove(id: number) {
    return this.prisma.consulta.delete({
      where: { id },
    });
  }
}