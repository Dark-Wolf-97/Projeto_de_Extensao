import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * O whatsapp-web.js dispara chamadas internas (ex: limpeza de sessão no
 * logout) a partir de listeners de eventos do Puppeteer que não passam por
 * nenhum request handler nosso — um erro ali vira uma rejeição de Promise
 * não tratada e derrubaria todo o processo. Um exemplo real e conhecido no
 * Windows: ao desvincular o aparelho pelo celular, o `LocalAuth.logout()`
 * tenta apagar os arquivos da sessão enquanto o Chromium ainda os tem
 * travados (EBUSY). Isso é interno à lib; não há como envolver com
 * try/catch no nosso código. Registramos aqui só pra esse tipo de falha
 * não ser fatal para a API inteira — continua logado para investigação.
 */
function protegerContraFalhasInternasDoWhatsapp() {
  const logger = new Logger('UnhandledError');
  process.on('unhandledRejection', (reason) => {
    logger.error('Rejeição de Promise não tratada', reason as Error);
  });
  process.on('uncaughtException', (error) => {
    logger.error('Exceção não capturada', error.stack);
  });
}

async function bootstrap() {
  protegerContraFalhasInternasDoWhatsapp();
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = process.env.CORS_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (allowedOrigins?.length) {
    app.enableCors({ origin: allowedOrigins });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
