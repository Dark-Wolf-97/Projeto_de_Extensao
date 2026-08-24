import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MensagensService } from './mensagens.service';
import { EditarMensagemDto } from './dto/editar-mensagem.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SECRETARIA)
@Controller('mensagens')
export class MensagensController {
  constructor(private readonly service: MensagensService) {}

  @Get('pendentes')
  listarPendentes() {
    return this.service.listarPendentes();
  }

  @Get('historico')
  listarHistorico() {
    return this.service.listarHistorico();
  }

  @Patch(':id')
  editar(@Param('id') id: string, @Body() dto: EditarMensagemDto) {
    return this.service.editarConteudo(Number(id), dto.conteudo);
  }

  @Patch(':id/cancelar')
  cancelar(@Param('id') id: string) {
    return this.service.cancelar(Number(id));
  }

  @Patch(':id/enviar-agora')
  enviarAgora(@Param('id') id: string) {
    return this.service.enviarAgora(Number(id));
  }
}
