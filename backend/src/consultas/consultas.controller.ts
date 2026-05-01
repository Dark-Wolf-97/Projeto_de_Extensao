import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ConsultasService } from './consultas.service';

@Controller('consultas')
export class ConsultasController {
  constructor(private readonly consultasService: ConsultasService) {}

  @Get()
  listar() {
    return this.consultasService.listar();
  }

  @Post()
  criar(@Body() consulta) {
    return this.consultasService.criar(consulta);
  }

  @Put(':id')
  atualizar(@Param('id') id: string, @Body() consulta) {
    return this.consultasService.atualizar(Number(id), consulta);
  }

  @Delete(':id')
  deletar(@Param('id') id: string) {
    return this.consultasService.deletar(Number(id));
  }
}