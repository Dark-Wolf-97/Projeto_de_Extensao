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
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-user.interface';
import { ProntuariosService } from './prontuarios.service';
import { CreateProntuarioDto } from './dto/create-prontuario.dto';
import { UpdateProntuarioDto } from './dto/update-prontuario.dto';

@Controller('prontuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProntuariosController {
  constructor(private readonly service: ProntuariosService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MEDICO)
  create(
    @Body() dto: CreateProntuarioDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.service.create(dto, req.user);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MEDICO)
  findAll(@Request() req: AuthenticatedRequest) {
    return this.service.findAll(req.user);
  }

  @Get('consulta/:consultaId')
  @Roles(Role.ADMIN, Role.MEDICO)
  findByConsulta(
    @Param('consultaId') consultaId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.service.findByConsulta(Number(consultaId), req.user);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MEDICO)
  findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.service.findOne(Number(id), req.user);
  }

  @Put(':id')
  @Roles(Role.MEDICO, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProntuarioDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.service.update(Number(id), dto, req.user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MEDICO)
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.service.remove(Number(id), req.user);
  }
}
