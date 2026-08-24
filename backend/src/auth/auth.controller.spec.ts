import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JWT_COOKIE_NAME } from './jwt.strategy';

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
  let response: Pick<Response, 'cookie' | 'clearCookie'>;

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
    response = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('deve gravar o JWT em cookie HttpOnly e não retorná-lo no corpo', async () => {
    const result = await controller.login(
      { email: 'admin@clinica.com', senha: 'senha-forte' },
      response,
    );

    expect(authService.login).toHaveBeenCalledWith(
      'admin@clinica.com',
      'senha-forte',
    );
    expect(response.cookie).toHaveBeenCalledWith(
      JWT_COOKIE_NAME,
      'fake.jwt.token',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
      }),
    );
    expect(result).toEqual({ user: mockLoginResponse.user });
    expect(result).not.toHaveProperty('token');
  });

  it('deve limpar o cookie ao encerrar a sessão', () => {
    controller.logout(response);

    expect(response.clearCookie).toHaveBeenCalledWith(
      JWT_COOKIE_NAME,
      expect.objectContaining({ httpOnly: true, secure: true, path: '/' }),
    );
  });

  it('deve propagar UnauthorizedException do AuthService', async () => {
    authService.login.mockRejectedValue(
      new UnauthorizedException('E-mail ou senha inválidos'),
    );

    await expect(
      controller.login(
        { email: 'errado@clinica.com', senha: 'errada' },
        response,
      ),
    ).rejects.toThrow(UnauthorizedException);
  });
});
