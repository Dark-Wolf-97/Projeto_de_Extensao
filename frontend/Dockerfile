FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:1.31.4-alpine AS runner

RUN apk add --no-cache openssl

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.d/10-generate-local-tls.sh /docker-entrypoint.d/10-generate-local-tls.sh
RUN chmod 755 /docker-entrypoint.d/10-generate-local-tls.sh

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
