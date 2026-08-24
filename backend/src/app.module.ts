import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PacientesModule } from './pacientes/pacientes.module';
import { ConsultasModule } from './consultas/consultas.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProntuariosModule } from './prontuarios/prontuarios.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { MensagensModule } from './mensagens/mensagens.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PacientesModule,
    ConsultasModule,
    AuthModule,
    UsersModule,
    ProntuariosModule,
    WhatsappModule,
    MensagensModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
