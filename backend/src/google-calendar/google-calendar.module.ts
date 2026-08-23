import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import {
  GOOGLE_CALENDAR_CLIENT_FACTORY,
  googleCalendarClientFactory,
} from './google-calendar.constants';
import { GoogleCalendarService } from './google-calendar.service';

@Module({
  imports: [PrismaModule],
  providers: [
    GoogleCalendarService,
    {
      provide: GOOGLE_CALENDAR_CLIENT_FACTORY,
      useValue: googleCalendarClientFactory,
    },
  ],
  exports: [GoogleCalendarService],
})
export class GoogleCalendarModule {}
