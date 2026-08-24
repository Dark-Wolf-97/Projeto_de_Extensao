import { Body, Controller, Post, Res } from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { JWT_COOKIE_NAME } from './jwt.strategy';

type AuthResponse = Pick<Response, 'cookie' | 'clearCookie'>;

class LoginDto {
  @IsEmail({}, { message: 'E-mail inválido' })
  email!: string;

  @IsNotEmpty({ message: 'Senha obrigatória' })
  @IsString()
  senha!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: AuthResponse,
  ) {
    const { token, user } = await this.auth.login(body.email, body.senha);
    response.cookie(JWT_COOKIE_NAME, token, this.cookieOptions());
    return { user };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: AuthResponse): void {
    response.clearCookie(JWT_COOKIE_NAME, {
      httpOnly: true,
      secure: this.cookieSecure(),
      sameSite: 'strict',
      path: '/',
    });
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: this.cookieSecure(),
      sameSite: 'strict' as const,
      path: '/',
      maxAge: this.jwtDurationMs(),
    };
  }

  private cookieSecure(): boolean {
    return process.env.COOKIE_SECURE?.trim().toLowerCase() !== 'false';
  }

  private jwtDurationMs(): number {
    const value = process.env.JWT_EXPIRES_IN?.trim() || '8h';
    const match = /^(\d+)([smhd])$/i.exec(value);
    if (!match) return 8 * 60 * 60 * 1000;

    const amount = Number(match[1]);
    const multipliers = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return (
      amount * multipliers[match[2].toLowerCase() as keyof typeof multipliers]
    );
  }
}
