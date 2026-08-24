import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { ConsultasModule } from '../consultas/consultas.module';
import { MensagensService } from './mensagens.service';
import { MensagensCronService } from './mensagens-cron.service';
import { MensagensController } from './mensagens.controller';

@Module({
  imports: [PrismaModule, WhatsappModule, forwardRef(() => ConsultasModule)],
  controllers: [MensagensController],
  providers: [MensagensService, MensagensCronService],
  exports: [MensagensService],
})
export class MensagensModule {}
