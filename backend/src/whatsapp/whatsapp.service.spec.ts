import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,FAKE'),
}));
import {
  WHATSAPP_CLIENT_FACTORY,
  WhatsappClient,
  WhatsappClientFactory,
  WhatsappInboundMessage,
} from './whatsapp.constants';
import { WhatsappService } from './whatsapp.service';

type Handler = (...args: unknown[]) => void;

function createFakeClient() {
  const handlers: Record<string, Handler[]> = {};
  const client: WhatsappClient = {
    initialize: jest.fn().mockResolvedValue(undefined),
    sendMessage: jest.fn(),
    getNumberId: jest
      .fn()
      .mockResolvedValue({ _serialized: '5542999990000@c.us' }),
    getState: jest.fn(),
    logout: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockResolvedValue(undefined),
    on: jest.fn((event: string, handler: Handler) => {
      (handlers[event] ??= []).push(handler);
      return client;
    }) as WhatsappClient['on'],
  };
  const emit = (event: string, ...args: unknown[]) => {
    for (const handler of handlers[event] ?? []) handler(...args);
  };
  return { client, emit };
}

const ENV_KEYS = ['WHATSAPP_ENABLED', 'WHATSAPP_SESSION_PATH'] as const;
const originalEnv = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
);

describe('WhatsappService', () => {
  let service: WhatsappService;
  let fake: ReturnType<typeof createFakeClient>;
  let factory: jest.MockedFunction<WhatsappClientFactory>;

  beforeEach(async () => {
    process.env.WHATSAPP_ENABLED = 'true';
    process.env.WHATSAPP_SESSION_PATH = './whatsapp-session-teste';

    fake = createFakeClient();
    factory = jest.fn().mockReturnValue(fake.client);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsappService,
        { provide: WHATSAPP_CLIENT_FACTORY, useValue: factory },
      ],
    }).compile();

    service = module.get(WhatsappService);
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(() => {
    for (const key of ENV_KEYS) {
      const value = originalEnv[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('não deve criar o client quando a integração está explicitamente desabilitada', async () => {
    process.env.WHATSAPP_ENABLED = 'false';

    await service.onModuleInit();

    expect(factory).not.toHaveBeenCalled();
    expect(service.getStatus()).toEqual({ status: 'DESCONECTADO', qr: null });
  });

  it('deve conectar sozinho no boot quando WHATSAPP_ENABLED não é definida (padrão habilitado)', async () => {
    delete process.env.WHATSAPP_ENABLED;

    await service.onModuleInit();

    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('deve inicializar o client ao conectar', async () => {
    await service.conectar();

    expect(factory).toHaveBeenCalledTimes(1);
    expect(fake.client.initialize).toHaveBeenCalledTimes(1);
  });

  it('deve expor o QR code como data URL ao receber o evento qr', async () => {
    await service.conectar();

    fake.emit('qr', '1@raw-qr-data');
    await Promise.resolve();
    await Promise.resolve();

    const status = service.getStatus();
    expect(status.status).toBe('AGUARDANDO_QR');
    expect(status.qr).toMatch(/^data:image\//);
  });

  it('deve marcar como conectado ao receber o evento ready', async () => {
    await service.conectar();
    fake.emit('qr', '1@raw-qr-data');
    await Promise.resolve();

    fake.emit('ready');

    expect(service.getStatus()).toEqual({ status: 'CONECTADO', qr: null });
  });

  it('deve marcar como desconectado e permitir reconectar ao receber disconnected', async () => {
    await service.conectar();
    fake.emit('ready');

    fake.emit('disconnected', 'LOGOUT');
    expect(service.getStatus()).toEqual({
      status: 'DESCONECTADO',
      qr: null,
    });

    await service.conectar();
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('enviarTexto deve recusar quando não está conectado', async () => {
    await expect(service.enviarTexto('5542999990000', 'Olá')).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('enviarTexto deve resolver o número, enviar e retornar o id da mensagem quando conectado', async () => {
    await service.conectar();
    fake.emit('ready');
    (fake.client.sendMessage as jest.Mock).mockResolvedValue({
      id: { _serialized: 'msg-123' },
    });

    const resultado = await service.enviarTexto('5542999990000', 'Olá');

    expect(fake.client.getNumberId).toHaveBeenCalledWith('5542999990000');
    expect(fake.client.sendMessage).toHaveBeenCalledWith(
      '5542999990000@c.us',
      'Olá',
    );
    expect(resultado).toEqual({ whatsappMessageId: 'msg-123' });
  });

  it('enviarTexto deve recusar quando o número não está registrado no WhatsApp', async () => {
    await service.conectar();
    fake.emit('ready');
    (fake.client.getNumberId as jest.Mock).mockResolvedValue(null);

    await expect(service.enviarTexto('5542999990000', 'Olá')).rejects.toThrow(
      BadRequestException,
    );
    expect(fake.client.sendMessage).not.toHaveBeenCalled();
  });

  it('enviarTexto não deve quebrar quando o envio funciona mas a lib não devolve o id da mensagem', async () => {
    await service.conectar();
    fake.emit('ready');
    (fake.client.sendMessage as jest.Mock).mockResolvedValue(undefined);

    const resultado = await service.enviarTexto('5542999990000', 'Olá');

    expect(resultado).toEqual({ whatsappMessageId: '' });
  });

  it('desconectar deve fazer logout, destruir o client e permitir reconectar', async () => {
    await service.conectar();
    fake.emit('ready');

    await service.desconectar();

    expect(fake.client.logout).toHaveBeenCalledTimes(1);
    expect(fake.client.destroy).toHaveBeenCalledTimes(1);
    expect(service.getStatus()).toEqual({ status: 'DESCONECTADO', qr: null });

    await service.conectar();
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('onInboundMessage deve receber mensagens que não são do próprio número', async () => {
    await service.conectar();
    const recebidas: WhatsappInboundMessage[] = [];
    service.onInboundMessage((msg) => recebidas.push(msg));

    fake.emit('message', {
      from: '5542999990000@c.us',
      body: 'sim',
      fromMe: false,
    });
    fake.emit('message', {
      from: '5542999990000@c.us',
      body: 'eco',
      fromMe: true,
    });

    expect(recebidas).toHaveLength(1);
    expect(recebidas[0].body).toBe('sim');
  });
});
