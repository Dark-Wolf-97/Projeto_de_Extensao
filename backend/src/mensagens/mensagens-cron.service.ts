import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MensagensService } from './mensagens.service';

const FUSO = 'America/Sao_Paulo';

@Injectable()
export class MensagensCronService {
  constructor(private readonly mensagens: MensagensService) {}

  @Cron('*/1 * * * *')
  async enviarPendentesDevidos(): Promise<void> {
    if (!this.executarNesteProcesso()) return;
    try {
      await this.mensagens.enviarPendentesDevidos();
    } catch {
      // Uma falha na rotina de envio nunca pode derrubar o agendador nem o Portal.
    }
  }

  @Cron('0 8 * * *', { timeZone: FUSO })
  async agendarLembretes(): Promise<void> {
    if (!this.executarNesteProcesso()) return;
    try {
      await this.mensagens.agendarLembretes();
    } catch {
      // Idem: falha aqui não pode impedir a próxima execução agendada.
    }
  }

  @Cron('0 8 * * *', { timeZone: FUSO })
  async agendarAniversarios(): Promise<void> {
    if (!this.executarNesteProcesso()) return;
    try {
      await this.mensagens.agendarAniversarios();
    } catch {
      // Idem.
    }
  }

  private executarNesteProcesso(): boolean {
    return process.env.PROCESS_ROLE === 'whatsapp-worker';
  }
}
