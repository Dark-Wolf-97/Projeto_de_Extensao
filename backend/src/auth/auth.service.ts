import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    const match = await bcrypt.compare(password, user.password);

    if (!match) throw new UnauthorizedException('Senha inválida');

    return {
      token: this.jwtService.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
      }),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}