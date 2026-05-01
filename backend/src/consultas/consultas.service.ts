import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ConsultasService {
  private consultas: any[] = [];

  listar() {
    return this.consultas;
  }

  criar(consulta) {
    const conflito = this.consultas.find(
      (c) => c.data === consulta.data && c.hora === consulta.hora
    );

    if (conflito) {
      throw new BadRequestException('Horário já ocupado');
    }

    this.consultas.push(consulta);
    return consulta;
  }

  atualizar(id: number, novaConsulta) {
    const conflito = this.consultas.find(
      (c, index) =>
        c.data === novaConsulta.data &&
        c.hora === novaConsulta.hora &&
        index !== id
    );

    if (conflito) {
      throw new BadRequestException('Horário já ocupado');
    }

    this.consultas[id] = novaConsulta;
    return novaConsulta;
  }

  deletar(id: number) {
    this.consultas.splice(id, 1);
    return { message: 'Consulta removida' };
  }
}