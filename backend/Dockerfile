# ─── Stage 1: build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# O whatsapp-web.js depende do puppeteer, que por padrão tenta baixar seu
# próprio Chromium na instalação. Este estágio só compila TypeScript e roda
# o prisma generate, não precisa de navegador nenhum.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY package*.json ./
RUN npm ci

COPY . .
RUN DATABASE_URL="mysql://dummy:dummy@localhost:3306/dummy" npx prisma generate
RUN npm run build

# ─── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Chromium real para o whatsapp-web.js (Puppeteer) rodar em produção.
# Verifique o caminho do binário na imagem base no momento do build
# (`apk info -L chromium | grep bin`), pois já mudou entre versões do Alpine.
RUN apk add --no-cache chromium nss freetype freetype-dev harfbuzz ca-certificates ttf-freefont
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma
COPY prisma.config.ts ./

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/src/main"]
