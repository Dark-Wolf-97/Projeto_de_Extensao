import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ConsultasService } from './consultas.service';
import { CreateConsultaDto } from './dto/create-consulta.dto';
import { UpdateConsultaDto } from './dto/update-consulta.dto';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-user.interface';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('consultas')
export class ConsultasController {
  constructor(private readonly service: ConsultasService) {}

  @Get('google-calendar/link')
  @Roles(Role.ADMIN, Role.SECRETARIA)
  buscarLinkAgenda() {
    return this.service.buscarLinkAgenda();
  }

  @Get()
  @Roles(Role.ADMIN, Role.SECRETARIA, Role.MEDICO)
  findAll(@Request() req: any) {
    if (req.user.role === Role.MEDICO) {
      return this.service.findByMedico(req.user.id);
    }
    return this.service.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SECRETARIA, Role.MEDICO)
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Post()
  @Roles(Role.ADMIN, Role.SECRETARIA)
  create(@Body() dto: CreateConsultaDto) {
    return this.service.create(dto);
  }

  @Post(':id/google-calendar')
  @Roles(Role.ADMIN, Role.SECRETARIA)
  recadastrarNaAgenda(@Param('id') id: string) {
    return this.service.recadastrarNaAgenda(Number(id));
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.SECRETARIA)
  update(@Param('id') id: string, @Body() dto: UpdateConsultaDto) {
    return this.service.update(Number(id), dto);
  }

  @Patch(':id/realizar')
  @Roles(Role.ADMIN, Role.MEDICO)
  realizar(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.service.realizar(Number(id), req.user);
  }

  @Patch(':id/confirmar')
  @Roles(Role.ADMIN, Role.SECRETARIA)
  confirmar(@Param('id') id: string) {
    return this.service.confirmar(Number(id));
  }

  @Patch(':id/cancelar')
  @Roles(Role.ADMIN, Role.SECRETARIA)
  cancelar(@Param('id') id: string) {
    return this.service.cancelar(Number(id));
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SECRETARIA)
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
