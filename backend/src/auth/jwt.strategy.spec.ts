import { extractJwtFromCookie } from './jwt.strategy';

describe('extractJwtFromCookie', () => {
  it('deve extrair o JWT do cookie HttpOnly da sessão', () => {
    expect(
      extractJwtFromCookie({
        headers: {
          cookie: 'tema=claro; portal_isg_session=jwt.codificado; idioma=pt-BR',
        },
      }),
    ).toBe('jwt.codificado');
  });

  it('deve retornar null quando o cookie da sessão não existe', () => {
    expect(
      extractJwtFromCookie({ headers: { cookie: 'tema=claro' } }),
    ).toBeNull();
  });
});
