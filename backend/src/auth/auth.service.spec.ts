import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

jest.mock('bcrypt');

const mockUser = {
  id: 1,
  nome: 'Dr. Carlos Silva',
  email: 'medico@clinica.com',
  senha: '$2b$10$hashedPassword',
  role: Role.MEDICO,
  crm: 'CRM-SP-12345',
  especialidade: 'Clínica Geral',
  telefone: '(11) 99999-0001',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const bcryptCompare = bcrypt.compare as jest.Mock;

describe('AuthService', () => {
  let service: AuthService;
  let usersService: { findByEmail: jest.Mock };
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: { findByEmail: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('fake.jwt.token') },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => jest.clearAllMocks());

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('login()', () => {
    it('deve retornar token e dados do usuário com credenciais corretas', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      bcryptCompare.mockResolvedValue(true);

      const result = await service.login('medico@clinica.com', 'medico123');

      expect(result).toEqual({
        token: 'fake.jwt.token',
        user: {
          id: 1,
          nome: 'Dr. Carlos Silva',
          email: 'medico@clinica.com',
          role: Role.MEDICO,
        },
      });
    });

    it('deve assinar o JWT com sub, email e role corretos', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      bcryptCompare.mockResolvedValue(true);

      await service.login('medico@clinica.com', 'medico123');

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        email: 'medico@clinica.com',
        role: Role.MEDICO,
      });
    });

    it('deve lançar UnauthorizedException quando e-mail não existe', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login('inexistente@clinica.com', 'senha123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve lançar UnauthorizedException quando senha está incorreta', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      bcryptCompare.mockResolvedValue(false);

      await expect(service.login('medico@clinica.com', 'senhaErrada')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve usar a mesma mensagem de erro para e-mail e senha inválidos', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      let errEmail = '';
      try {
        await service.login('wrong@email.com', 'senha');
      } catch (e: any) {
        errEmail = e.message;
      }

      usersService.findByEmail.mockResolvedValue(mockUser);
      bcryptCompare.mockResolvedValue(false);

      let errSenha = '';
      try {
        await service.login('medico@clinica.com', 'senhaErrada');
      } catch (e: any) {
        errSenha = e.message;
      }

      expect(errEmail).toBe(errSenha);
      expect(errEmail).toBe('E-mail ou senha inválidos');
    });

    it('deve buscar o usuário pelo e-mail informado', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      try {
        await service.login('test@clinica.com', 'senha');
      } catch {}

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@clinica.com');
    });

    it('não deve assinar JWT quando as credenciais são inválidas', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      try {
        await service.login('wrong@email.com', 'senha');
      } catch {}

      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });
});
