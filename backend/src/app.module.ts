import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PacientesModule } from './pacientes/pacientes.module';
import { ConsultasModule } from './consultas/consultas.module';

@Module({
  imports: [PacientesModule, ConsultasModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
