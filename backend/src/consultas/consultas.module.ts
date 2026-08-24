import { Module, forwardRef } from '@nestjs/common';
import { ConsultasService } from './consultas.service';
import { ConsultasController } from './consultas.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { GoogleCalendarModule } from '../google-calendar/google-calendar.module';
import { MensagensModule } from '../mensagens/mensagens.module';

@Module({
  imports: [
    PrismaModule,
    GoogleCalendarModule,
    forwardRef(() => MensagensModule),
  ],
  controllers: [ConsultasController],
  providers: [ConsultasService],
  exports: [ConsultasService],
})
export class ConsultasModule {}
