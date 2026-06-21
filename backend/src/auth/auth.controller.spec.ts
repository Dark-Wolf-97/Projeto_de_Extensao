import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockLoginResponse = {
  token: 'fake.jwt.token',
  user: {
    id: 1,
    nome: 'Administrador',
    email: 'admin@clinica.com',
    role: Role.ADMIN,
  },
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { login: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: { login: jest.fn().mockResolvedValue(mockLoginResponse) },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('login()', () => {
    it('deve chamar AuthService.login com email e senha', async () => {
      await controller.login({ email: 'admin@clinica.com', senha: 'admin123' } as any);

      expect(authService.login).toHaveBeenCalledWith('admin@clinica.com', 'admin123');
    });

    it('deve retornar o token e os dados do usuário', async () => {
      const result = await controller.login({
        email: 'admin@clinica.com',
        senha: 'admin123',
      } as any);

      expect(result.token).toBe('fake.jwt.token');
      expect(result.user).toEqual({
        id: 1,
        nome: 'Administrador',
        email: 'admin@clinica.com',
        role: Role.ADMIN,
      });
    });

    it('deve propagar UnauthorizedException do AuthService', async () => {
      authService.login.mockRejectedValue(
        new UnauthorizedException('E-mail ou senha inválidos'),
      );

      await expect(
        controller.login({ email: 'errado@clinica.com', senha: 'errada' } as any),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
