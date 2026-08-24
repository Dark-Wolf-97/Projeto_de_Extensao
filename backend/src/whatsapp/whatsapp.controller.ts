import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WhatsappService } from './whatsapp.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsapp: WhatsappService) {}

  @Get('status')
  status() {
    return this.whatsapp.getStatus();
  }

  @Post('conectar')
  conectar() {
    return this.whatsapp.conectar();
  }

  @Post('desconectar')
  desconectar() {
    return this.whatsapp.desconectar();
  }
}
