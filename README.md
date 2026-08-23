# Portal ISG

Sistema de gestão clínica com frontend React, API NestJS e banco MySQL. A execução
integrada usa Docker Compose e publica somente o frontend na porta 80; o Nginx
encaminha `/api` para o backend dentro da rede dos containers.

## Execução local com Docker

1. Copie `.env.docker.example` para `.env`.
2. Preencha `DB_PASSWORD`, `JWT_SECRET` e as demais configurações sem versionar o
   arquivo `.env`.
3. Execute:

```bash
docker compose up --build -d
```

Na máquina que hospeda o sistema, acesse `http://localhost`. Em outra máquina da
mesma rede, acesse `http://IP_DA_MAQUINA`. A porta TCP 80 precisa estar liberada no
firewall do host. O frontend usa `/api`, portanto não depende de `localhost` no
JavaScript entregue ao navegador.

`CORS_ORIGIN` só é necessário se a API for publicada e acessada diretamente por
outra origem. Quando configurado, aceita uma lista de origens separadas por vírgula.

## Seed dos usuários iniciais (ADMIN, SECRETARIA, MEDICO)

O seed não possui senha padrão, usa bcrypt e não altera a senha de um usuário já
existente. Cada perfil (`ADMIN_*`, `SECRETARIA_*`, `MEDICO_*`) é opcional e
independente: se as variáveis de um perfil ficarem todas em branco, aquele
usuário simplesmente não é criado; se ficarem parcialmente preenchidas, o
comando falha avisando qual variável está faltando. A senha de cada perfil
exige de 12 a 72 bytes. O perfil `MEDICO` também exige `MEDICO_CRM` e
`MEDICO_ESPECIALIDADE`.

Para desenvolvimento, crie um arquivo `backend/.env` não versionado com:

```dotenv
DATABASE_URL=mysql://usuario:senha@localhost:3306/clinica_db
ADMIN_NOME=Nome do Administrador
ADMIN_EMAIL=administrador@exemplo.com
ADMIN_PASSWORD=

SECRETARIA_NOME=Nome da Secretaria
SECRETARIA_EMAIL=secretaria@exemplo.com
SECRETARIA_PASSWORD=

MEDICO_NOME=Nome do Medico
MEDICO_EMAIL=medico@exemplo.com
MEDICO_PASSWORD=
MEDICO_CRM=12345-SP
MEDICO_ESPECIALIDADE=Clinico Geral
```

Depois execute:

```bash
cd backend
npm ci
npm run seed
```

Com os containers em execução, preencha temporariamente as variáveis dos
perfis desejados no `.env` da raiz e execute:

```bash
docker compose exec backend node dist/src/seed.js
```

Após o cadastro, remova as variáveis preenchidas do `.env` e recrie o container
do backend para que as senhas deixem de existir no ambiente do processo.
Executar o comando novamente não duplica os usuários nem redefine senhas.

## Validação

Frontend:

```bash
cd frontend
npm ci
npm run typecheck
npm run lint
npm run test:run
npm run build
```

Backend:

```bash
cd backend
npm ci
DATABASE_URL=mysql://root:root@localhost:3306/clinica_db npx prisma generate
npm run build
npm test -- --runInBand
```

## Mensageria

A mensageria está explicitamente indisponível neste bloco. A próxima etapa deverá
usar `whatsapp-web.js` com sessão persistente via `LocalAuth` em volume local
protegido. Z-API não faz parte da solução.

## Google Agenda (Bloco 1.5)

A integração usa a API do Google Calendar exclusivamente no backend. Para ativá-la:

1. Ative a Google Calendar API no projeto Google Cloud da clínica e crie uma
   service account.
2. Compartilhe a agenda usada pela clínica com o e-mail da service account,
   permitindo alterações nos eventos.
3. Configure as variáveis abaixo no `.env` não versionado da implantação:

```dotenv
GOOGLE_CALENDAR_ENABLED=true
GOOGLE_CALENDAR_ID=identificador_da_agenda
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@projeto.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_TIMEZONE=America/Sao_Paulo
GOOGLE_CALENDAR_DEFAULT_DURATION_MINUTES=30
```

Não salve o arquivo JSON da service account no repositório. A agenda pode conter
consultas simultâneas; o Portal não usa os eventos do Google para bloquear
horários. Se a integração estiver desabilitada ou temporariamente indisponível,
o CRUD de consultas continua funcionando e ADMIN/SECRETARIA podem tentar o
recadastro posteriormente pela listagem.
