import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PacientesService } from './pacientes.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('pacientes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  @Get()
  listar() {
    return this.pacientesService.listar();
  }

  @Get('buscar')
  buscar(@Query('nome') nome: string) {
    return this.pacientesService.buscar(nome);
  }

  @Get('aniversarios')
  listarAniversariosMes() {
    return this.pacientesService.listarAniversariosMes();
  }

  @Get(':id')
  findPerfil(@Param('id') id: string) {
    return this.pacientesService.findPerfil(Number(id));
  }

  @Post()
  @Roles(Role.ADMIN, Role.SECRETARIA)
  criar(@Body() dto: CreatePacienteDto) {
    return this.pacientesService.criar(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.SECRETARIA)
  atualizar(@Param('id') id: string, @Body() dto: UpdatePacienteDto) {
    return this.pacientesService.atualizar(Number(id), dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SECRETARIA)
  remover(@Param('id') id: string) {
    return this.pacientesService.remover(Number(id));
  }
}
