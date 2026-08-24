import { Client, LocalAuth } from 'whatsapp-web.js';

export const WHATSAPP_CLIENT_FACTORY = Symbol('WHATSAPP_CLIENT_FACTORY');

export interface WhatsappInboundMessage {
  from: string;
  body: string;
  fromMe: boolean;
}

/**
 * Superfície mínima do `Client` do whatsapp-web.js realmente usada pelo
 * WhatsappService. Existe para permitir injetar uma fábrica falsa nos testes
 * sem nunca instanciar um Puppeteer/Chromium real.
 */
export interface WhatsappClient {
  initialize(): Promise<void>;
  sendMessage(
    chatId: string,
    content: string,
  ): Promise<{ id?: { _serialized: string } } | undefined>;
  getNumberId(number: string): Promise<{ _serialized: string } | null>;
  getState(): Promise<string | null>;
  logout(): Promise<void>;
  destroy(): Promise<void>;
  on(event: 'qr', listener: (qr: string) => void): unknown;
  on(event: 'ready', listener: () => void): unknown;
  on(event: 'disconnected', listener: (reason: string) => void): unknown;
  on(
    event: 'message',
    listener: (message: WhatsappInboundMessage) => void,
  ): unknown;
}

export interface WhatsappClientConfig {
  sessionPath: string;
  puppeteerExecutablePath?: string;
}

export type WhatsappClientFactory = (
  config: WhatsappClientConfig,
) => WhatsappClient;

export const whatsappClientFactory: WhatsappClientFactory = ({
  sessionPath,
  puppeteerExecutablePath,
}) => {
  const client = new Client({
    // rmMaxRetries alto: no Windows o Chromium pode segurar os arquivos da
    // sessão por um instante durante o logout, dando EBUSY nas primeiras
    // tentativas de apagar (ver nota em main.ts e AGENTS.md).
    authStrategy: new LocalAuth({ dataPath: sessionPath, rmMaxRetries: 20 }),
    puppeteer: {
      headless: true,
      executablePath: puppeteerExecutablePath || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    },
  });

  return client;
};
