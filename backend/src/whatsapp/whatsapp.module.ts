import { Module } from '@nestjs/common';
import {
  WHATSAPP_CLIENT_FACTORY,
  whatsappClientFactory,
} from './whatsapp.constants';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';

@Module({
  controllers: [WhatsappController],
  providers: [
    WhatsappService,
    {
      provide: WHATSAPP_CLIENT_FACTORY,
      useValue: whatsappClientFactory,
    },
  ],
  exports: [WhatsappService],
})
export class WhatsappModule {}
