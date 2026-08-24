import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '@prisma/client';

interface RequestWithCookieHeader {
  headers?: { cookie?: string };
}

export const JWT_COOKIE_NAME = 'portal_isg_session';

export function extractJwtFromCookie(
  request: RequestWithCookieHeader,
): string | null {
  const cookieHeader = request.headers?.cookie;
  if (!cookieHeader) return null;

  const cookie = cookieHeader
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${JWT_COOKIE_NAME}=`));

  if (!cookie) return null;
  const value = cookie.slice(JWT_COOKIE_NAME.length + 1);
  return value ? decodeURIComponent(value) : null;
}

interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        extractJwtFromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  validate(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
