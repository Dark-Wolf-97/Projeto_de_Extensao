import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { EventEmitter } from 'events';
import * as QRCode from 'qrcode';
import {
  WHATSAPP_CLIENT_FACTORY,
  WhatsappClient,
  WhatsappClientFactory,
  WhatsappInboundMessage,
} from './whatsapp.constants';

export type WhatsappStatus = 'DESCONECTADO' | 'AGUARDANDO_QR' | 'CONECTADO';

export interface WhatsappStatusInfo {
  status: WhatsappStatus;
  qr: string | null;
}

interface WhatsappConfig {
  enabled: boolean;
  sessionPath: string;
  puppeteerExecutablePath?: string;
}

@Injectable()
export class WhatsappService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsappService.name);
  private client: WhatsappClient | undefined;
  private status: WhatsappStatus = 'DESCONECTADO';
  private qr: string | null = null;
  private readonly inbound = new EventEmitter();

  constructor(
    @Inject(WHATSAPP_CLIENT_FACTORY)
    private readonly createClient: WhatsappClientFactory,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.getConfig().enabled) return;
    try {
      await this.conectar();
    } catch {
      // Uma falha ao conectar na inicialização nunca pode impedir o Portal de subir.
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.client?.destroy();
    } catch {
      // Encerramento best-effort.
    }
  }

  getStatus(): WhatsappStatusInfo {
    return { status: this.status, qr: this.qr };
  }

  async conectar(): Promise<WhatsappStatusInfo> {
    if (this.client) return this.getStatus();

    const config = this.getConfig();
    const client = this.createClient({
      sessionPath: config.sessionPath,
      puppeteerExecutablePath: config.puppeteerExecutablePath,
    });

    client.on('qr', (qr) => {
      void this.handleQr(qr);
    });
    client.on('ready', () => {
      this.status = 'CONECTADO';
      this.qr = null;
    });
    client.on('disconnected', () => {
      this.status = 'DESCONECTADO';
      this.qr = null;
      this.client = undefined;
      // Best-effort: fecha o Chromium da sessão antiga (ex: aparelho
      // desvinculado pelo celular) para não deixar processo órfão.
      client.destroy().catch(() => {});
    });
    client.on('message', (message) => {
      this.handleInboundMessage(message);
    });

    this.client = client;
    await client.initialize();
    return this.getStatus();
  }

  async desconectar(): Promise<WhatsappStatusInfo> {
    const client = this.client;
    this.client = undefined;
    this.status = 'DESCONECTADO';
    this.qr = null;

    if (client) {
      try {
        await client.logout();
      } catch {
        // Se o logout falhar (ex: já desconectado), ainda assim liberamos o estado local.
      }
      try {
        await client.destroy();
      } catch {
        // Encerramento best-effort.
      }
    }

    return this.getStatus();
  }

  async enviarTexto(
    telefoneE164: string,
    mensagem: string,
  ): Promise<{ whatsappMessageId: string }> {
    if (this.status !== 'CONECTADO' || !this.client) {
      throw new ServiceUnavailableException(
        'O WhatsApp não está conectado no momento.',
      );
    }

    // Resolve o número antes de enviar (em vez de montar "numero@c.us" na mão):
    // o WhatsApp usa um identificador interno (LID) que a lib só resolve
    // corretamente por esse caminho, além de detectar número sem WhatsApp.
    const contato = await this.client.getNumberId(telefoneE164);
    if (!contato) {
      throw new BadRequestException(
        'Este telefone não está registrado no WhatsApp.',
      );
    }

    const resultado = await this.client.sendMessage(
      contato._serialized,
      mensagem,
    );
    // whatsapp-web.js às vezes não devolve o id serializado da mensagem
    // (ex: quando o chat ainda não existia antes desse envio); isso não
    // significa que o envio falhou, então não tratamos como erro.
    return { whatsappMessageId: resultado?.id?._serialized ?? '' };
  }

  onInboundMessage(handler: (message: WhatsappInboundMessage) => void): void {
    this.inbound.on('mensagem-recebida', handler);
  }

  private async handleQr(qr: string): Promise<void> {
    try {
      this.qr = await QRCode.toDataURL(qr);
      this.status = 'AGUARDANDO_QR';
    } catch {
      // Se a conversão para imagem falhar, mantemos o status anterior em vez de travar o fluxo.
    }
  }

  private handleInboundMessage(message: WhatsappInboundMessage): void {
    this.logger.debug(
      `Mensagem recebida de "${message.from}" (fromMe=${message.fromMe}, ${message.body.length} caracteres)`,
    );
    if (message.fromMe) return;
    this.inbound.emit('mensagem-recebida', message);
  }

  /**
   * `enabled` só controla se o client conecta sozinho no boot (onModuleInit).
   * Ele NÃO é um interruptor completo: o botão "Conectar" em Configurações e
   * o endpoint POST /whatsapp/conectar chamam `conectar()` diretamente e
   * funcionam independente desse valor. Se WHATSAPP_ENABLED não for definida,
   * o padrão é habilitado (tenta conectar sozinho); defina explicitamente
   * como "false" ou "0" para não conectar automaticamente no boot.
   */
  private getConfig(): WhatsappConfig {
    const rawEnabled = process.env.WHATSAPP_ENABLED?.trim();
    return {
      enabled: rawEnabled ? /^(true|1)$/i.test(rawEnabled) : true,
      sessionPath:
        process.env.WHATSAPP_SESSION_PATH?.trim() || './whatsapp-session',
      puppeteerExecutablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH?.trim() || undefined,
    };
  }
}
