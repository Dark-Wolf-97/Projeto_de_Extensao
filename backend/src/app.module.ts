import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PacientesModule } from './pacientes/pacientes.module';
import { ConsultasModule } from './consultas/consultas.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProntuariosModule } from './prontuarios/prontuarios.module';

@Module({
  imports: [PacientesModule, ConsultasModule, AuthModule, UsersModule, ProntuariosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
