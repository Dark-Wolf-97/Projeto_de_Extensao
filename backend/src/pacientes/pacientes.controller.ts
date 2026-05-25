import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Delete,
  Param,
  Query,
} from '@nestjs/common';

import { PacientesService } from './pacientes.service';

import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';

@Controller('pacientes')
export class PacientesController {
  constructor(
    private readonly pacientesService: PacientesService,
  ) {}

  @Get()
  listar() {
    return this.pacientesService.listar();
  }

  @Get('buscar')
  buscar(@Query('nome') nome: string) {
    return this.pacientesService.buscar(nome);
  }

  @Post()
  criar(
    @Body() paciente: CreatePacienteDto,
  ) {
    return this.pacientesService.criar(paciente);
  }

  @Put(':id')
  atualizar(
    @Param('id') id: string,
    @Body() paciente: UpdatePacienteDto,
  ) {
    return this.pacientesService.atualizar(
      Number(id),
      paciente,
    );
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.pacientesService.remover(
      Number(id),
    );
  }

  @Get("aniversarios")
  listarAniversariosMes() {
    return this.pacientesService.listarAniversariosMes();
  }
}