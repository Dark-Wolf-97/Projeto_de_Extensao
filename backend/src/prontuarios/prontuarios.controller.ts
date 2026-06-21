import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProntuariosService } from './prontuarios.service';
import { CreateProntuarioDto } from './dto/create-prontuario.dto';
import { UpdateProntuarioDto } from './dto/update-prontuario.dto';

@Controller('prontuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProntuariosController {
  constructor(private readonly service: ProntuariosService) {}

  @Post()
  @Roles(Role.MEDICO)
  create(@Body() dto: CreateProntuarioDto, @Request() req: any) {
    return this.service.create(dto, req.user.id);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.service.findAll(req.user);
  }

  @Get('consulta/:consultaId')
  findByConsulta(@Param('consultaId') consultaId: string) {
    return this.service.findByConsulta(Number(consultaId));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Put(':id')
  @Roles(Role.MEDICO, Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateProntuarioDto, @Request() req: any) {
    return this.service.update(Number(id), dto, req.user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MEDICO)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(Number(id), req.user);
  }
}
