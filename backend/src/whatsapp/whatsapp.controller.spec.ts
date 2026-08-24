import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';

describe('WhatsappController', () => {
  let controller: WhatsappController;
  let service: {
    getStatus: jest.Mock;
    conectar: jest.Mock;
    desconectar: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhatsappController],
      providers: [
        {
          provide: WhatsappService,
          useValue: {
            getStatus: jest
              .fn()
              .mockReturnValue({ status: 'DESCONECTADO', qr: null }),
            conectar: jest
              .fn()
              .mockResolvedValue({ status: 'AGUARDANDO_QR', qr: 'data:x' }),
            desconectar: jest
              .fn()
              .mockResolvedValue({ status: 'DESCONECTADO', qr: null }),
          },
        },
      ],
    }).compile();

    controller = module.get(WhatsappController);
    service = module.get(WhatsappService);
  });

  afterEach(() => jest.clearAllMocks());

  it('deve restringir todas as rotas a ADMIN', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, WhatsappController);
    expect(roles).toEqual([Role.ADMIN]);
  });

  it('deve encaminhar status/conectar/desconectar ao service', async () => {
    expect(controller.status()).toEqual({ status: 'DESCONECTADO', qr: null });

    await controller.conectar();
    expect(service.conectar).toHaveBeenCalled();

    await controller.desconectar();
    expect(service.desconectar).toHaveBeenCalled();
  });
});
