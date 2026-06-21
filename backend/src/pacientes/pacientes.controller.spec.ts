import { Test, TestingModule } from '@nestjs/testing';
import { PacientesController } from './pacientes.controller';
import { PacientesService } from './pacientes.service';

describe('PacientesController', () => {
  let controller: PacientesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PacientesController],
      providers: [
        { provide: PacientesService, useValue: {} },
      ],
    }).compile();

    controller = module.get<PacientesController>(PacientesController);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });
});
