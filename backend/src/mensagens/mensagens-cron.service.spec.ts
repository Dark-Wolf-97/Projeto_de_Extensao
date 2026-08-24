import { Test, TestingModule } from '@nestjs/testing';
import { MensagensCronService } from './mensagens-cron.service';
import { MensagensService } from './mensagens.service';

describe('MensagensCronService', () => {
  let service: MensagensCronService;
  let mensagens: {
    enviarPendentesDevidos: jest.Mock;
    agendarLembretes: jest.Mock;
    agendarAniversarios: jest.Mock;
  };
  const processRoleOriginal = process.env.PROCESS_ROLE;

  beforeEach(async () => {
    mensagens = {
      enviarPendentesDevidos: jest.fn().mockResolvedValue(undefined),
      agendarLembretes: jest.fn().mockResolvedValue(undefined),
      agendarAniversarios: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MensagensCronService,
        { provide: MensagensService, useValue: mensagens },
      ],
    }).compile();

    service = module.get(MensagensCronService);
  });

  afterEach(() => {
    if (processRoleOriginal === undefined) delete process.env.PROCESS_ROLE;
    else process.env.PROCESS_ROLE = processRoleOriginal;
  });

  it('não deve executar rotinas no processo da API', async () => {
    process.env.PROCESS_ROLE = 'api';

    await service.enviarPendentesDevidos();
    await service.agendarLembretes();
    await service.agendarAniversarios();

    expect(mensagens.enviarPendentesDevidos).not.toHaveBeenCalled();
    expect(mensagens.agendarLembretes).not.toHaveBeenCalled();
    expect(mensagens.agendarAniversarios).not.toHaveBeenCalled();
  });

  it('deve executar rotinas somente no worker do WhatsApp', async () => {
    process.env.PROCESS_ROLE = 'whatsapp-worker';

    await service.enviarPendentesDevidos();
    await service.agendarLembretes();
    await service.agendarAniversarios();

    expect(mensagens.enviarPendentesDevidos).toHaveBeenCalledTimes(1);
    expect(mensagens.agendarLembretes).toHaveBeenCalledTimes(1);
    expect(mensagens.agendarAniversarios).toHaveBeenCalledTimes(1);
  });
});
