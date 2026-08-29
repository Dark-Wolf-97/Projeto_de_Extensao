import { Module } from '@nestjs/common';
import { PacientesController } from './pacientes.controller';
import { PacientesService } from './pacientes.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GoogleCalendarModule } from '../google-calendar/google-calendar.module';

@Module({
  imports: [PrismaModule, GoogleCalendarModule],
  controllers: [PacientesController],
  providers: [PacientesService],
})
export class PacientesModule {}
