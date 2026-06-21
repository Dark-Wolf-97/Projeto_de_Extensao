import { Test, TestingModule } from '@nestjs/testing';
import { PacientesService } from './pacientes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PacientesService', () => {
  let service: PacientesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PacientesService,
        { provide: PrismaService, useValue: { paciente: {} } },
      ],
    }).compile();

    service = module.get<PacientesService>(PacientesService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });
});
