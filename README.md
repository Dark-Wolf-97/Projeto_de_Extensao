# Portal ISG

Sistema web de gestão clínica desenvolvido para a Clínica ISG - Instituto de
Saúde de Guarapuava. O portal centraliza pacientes, usuários, consultas e
prontuários, integra agendamentos ao Google Agenda e oferece rotinas de
mensageria pelo WhatsApp.

> Prontuários e dados clínicos são dados sensíveis. Use credenciais individuais,
> mantenha os segredos fora do Git e restrinja o acesso ao ambiente implantado.

## Funcionalidades principais

- autenticação e controle de acesso para `ADMIN`, `SECRETARIA` e `MEDICO`;
- cadastro, busca e manutenção de pacientes;
- agendamento, reagendamento e acompanhamento de consultas;
- prontuário eletrônico com regras de acesso aplicadas no backend;
- dashboard com indicadores da clínica;
- sincronização opcional de consultas com o Google Calendar;
- fila de confirmações, lembretes e mensagens de aniversário pelo WhatsApp;
- execução integrada com HTTPS, proxy reverso, healthchecks e volumes
  persistentes por meio do Docker Compose.

## Tecnologias e arquitetura

| Camada | Tecnologias |
| --- | --- |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS e Vitest |
| Backend | NestJS, TypeScript, Prisma 7 e Jest |
| Banco de dados | MySQL 8.0 (compatível com MariaDB no desenvolvimento) |
| Integrações | Google Calendar API e `whatsapp-web.js` |
| Infraestrutura | Docker Compose, Nginx e TLS local |

Na implantação completa, quatro containers trabalham em conjunto:

- `frontend`: serve a aplicação React, encerra o TLS e encaminha `/api`;
- `api`: executa a API NestJS e aplica as migrações do Prisma;
- `whatsapp-worker`: mantém a sessão do WhatsApp e executa as rotinas agendadas;
- `mysql`: armazena os dados da aplicação.

Somente o Nginx publica as portas `80` e `443`. A API, o worker e o banco ficam
nas redes internas do Docker.

## Estrutura do repositório

```text
Projeto_de_Extensao/
|-- backend/                 # API, worker, Prisma e testes Jest
|   |-- prisma/              # schema e migrações do banco
|   `-- src/                 # módulos NestJS
|-- frontend/                # SPA React e testes Vitest
|-- deploy/                  # scripts operacionais e de backup
|-- documentos/              # requisitos, arquitetura, manuais e decisões
|-- docker-compose.yml       # pilha integrada
|-- DEPLOY_WINDOWS.md        # guia detalhado de implantação
`-- README.md
```

## Pré-requisitos

### Desenvolvimento sem Docker

- Git;
- Node.js 22 LTS e npm;
- MySQL 8.0 ou MariaDB compatível;
- duas janelas de terminal, uma para o backend e outra para o frontend.

### Execução integrada com Docker

- Docker Engine com Docker Compose, ou Docker Desktop com WSL2 no Windows;
- pelo menos 8 GB de memória e 20 GB de espaço livre para a pilha completa;
- portas `80` e `443` livres.

## Configuração do ambiente de desenvolvimento

### 1. Obtenha o código

```bash
git clone https://github.com/Dark-Wolf-97/Projeto_de_Extensao.git
cd Projeto_de_Extensao
```

### 2. Prepare o banco de dados

Crie um banco MySQL local vazio. O nome usado nos exemplos é `clinica_db`:

```sql
CREATE DATABASE clinica_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Crie `backend/.env` a partir do modelo correspondente:

```powershell
Copy-Item backend/.env.example backend/.env
```

Em Linux ou macOS, o comando equivalente é:

```bash
cp backend/.env.example backend/.env
```

Preencha pelo menos estas variáveis no arquivo, usando valores locais seguros:

```dotenv
DATABASE_URL="mysql://usuario:senha@localhost:3306/clinica_db"
PORT=3000
JWT_SECRET="gere-uma-chave-aleatoria-com-pelo-menos-32-bytes"
JWT_EXPIRES_IN="1d"
COOKIE_SECURE=false
PROCESS_ROLE=api
WHATSAPP_ENABLED=false
WHATSAPP_SESSION_PATH=./whatsapp-session
```

`COOKIE_SECURE=false` é indicado somente para desenvolvimento via HTTP. Em uma
implantação HTTPS, mantenha-o habilitado. `WHATSAPP_ENABLED=false` impede apenas
a conexão automática no início; o botão administrativo **Conectar** continua
disponível por decisão do projeto.

### 3. Instale as dependências e prepare o Prisma

```bash
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
cd ../frontend
npm ci
cd ..
```

Nunca altere ou apague migrações históricas. Mudanças de modelo devem gerar uma
nova migração com `npx prisma migrate dev --name descricao_da_mudanca` dentro de
`backend/`.

### 4. Configure as integrações opcionais

O sistema funciona sem Google Calendar. Para habilitá-lo, configure no
`backend/.env`:

```dotenv
GOOGLE_CALENDAR_ENABLED=true
GOOGLE_CALENDAR_ID=identificador_da_agenda
GOOGLE_SERVICE_ACCOUNT_EMAIL=conta@projeto.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_TIMEZONE=America/Sao_Paulo
GOOGLE_CALENDAR_DEFAULT_DURATION_MINUTES=30
```

Ative a Google Calendar API, crie uma conta de serviço e compartilhe a agenda
com essa conta usando a permissão **Fazer alterações nos eventos**. O guia
detalhado está em
[`documentos/guias/integracao_calendar.md`](documentos/guias/integracao_calendar.md).
Nunca versione o JSON da conta de serviço.

## Como rodar localmente

### Desenvolvimento sem Docker

No primeiro terminal, inicie o backend:

```bash
cd backend
npm run start:dev
```

No segundo terminal, inicie o frontend:

```bash
cd frontend
npm run dev
```

Acesse [http://localhost:8080](http://localhost:8080). O Vite encaminha as
requisições feitas a `/api` para o backend em `http://localhost:3000`.

### Pilha completa com Docker Compose

Copie o modelo de ambiente da raiz:

```powershell
Copy-Item .env.docker.example .env
```

Em Linux ou macOS:

```bash
cp .env.docker.example .env
```

Preencha no mínimo `DB_ROOT_PASSWORD`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`,
`TLS_HOSTNAME` e `TLS_IP_ADDRESS`. Use senhas longas e diferentes; não versione
nem compartilhe o arquivo `.env`.

Valide e inicie os serviços:

```bash
docker compose config
docker compose up --build -d
docker compose ps
```

Na máquina que hospeda a pilha, acesse `https://localhost`. Em outra máquina da
rede, use o hostname ou IP configurado. O certificado local precisa ser
instalado como confiável nas estações; consulte o guia de deploy para o passo a
passo.

Para encerrar os containers preservando os dados:

```bash
docker compose down
```

Não use `docker compose down -v` em um ambiente com dados importantes: essa
opção remove o banco, a sessão do WhatsApp e os certificados persistidos.

## Usuários iniciais

O seed permite criar, de forma independente, usuários `ADMIN`, `SECRETARIA` e
`MEDICO`. Preencha temporariamente no arquivo de ambiente as variáveis do perfil
desejado. As senhas precisam ter de 12 a 72 bytes; médico também exige CRM e
especialidade.

Em desenvolvimento sem Docker:

```bash
cd backend
npm run seed
```

Com a pilha em execução:

```bash
docker compose exec api node dist/src/seed.js
```

O seed não duplica usuários nem redefine senhas existentes. Depois da execução,
remova as senhas do arquivo de ambiente. Em Docker, recrie a API para retirar
esses valores do ambiente do processo:

```bash
docker compose up -d --force-recreate api
```

## Validação e testes

Frontend:

```bash
cd frontend
npm ci
npm run typecheck
npm run lint
npm run test:run
npm run build
```

Backend em Bash:

```bash
cd backend
npm ci
DATABASE_URL=mysql://root:root@localhost:3306/clinica_db npx prisma generate
npm run build
npm test -- --runInBand
```

No PowerShell, defina a variável apenas para o comando do Prisma desta forma:

```powershell
cd backend
npm ci
$env:DATABASE_URL='mysql://root:root@localhost:3306/clinica_db'
npx prisma generate
Remove-Item Env:DATABASE_URL
npm run build
npm test -- --runInBand
```

Para validar a infraestrutura:

```bash
docker compose config
docker compose build
```

## Deploy básico

A implantação de referência é feita em um servidor Windows da rede local com
Docker Desktop e WSL2. O fluxo resumido é:

1. reservar um IP para o servidor e configurar um hostname interno;
2. copiar `.env.docker.example` para `.env` e preencher os segredos;
3. executar `docker compose up --build -d`;
4. exportar a autoridade certificadora pública criada pelo container e
   instalá-la nas estações clientes;
5. liberar somente as portas `80` e `443` no perfil privado do firewall;
6. criar os usuários iniciais e remover suas senhas do ambiente;
7. configurar e testar backups diários em outro disco ou armazenamento
   protegido;
8. validar login, pacientes, consultas, prontuários, Google Agenda e WhatsApp.

As instruções completas de certificado, firewall, backup, restauração,
atualização e diagnóstico estão em [`DEPLOY_WINDOWS.md`](DEPLOY_WINDOWS.md).

Antes de atualizar uma instalação, gere e confira um backup. Não publique o
Portal diretamente na internet sem uma revisão adicional de segurança, VPN e
política de acesso.

## Observações sobre o WhatsApp

A integração usa `whatsapp-web.js`; a Z-API não faz parte da solução. Como essa
é uma integração não oficial, mudanças do WhatsApp podem interromper o serviço e
existe risco de bloqueio da conta.

A versão atual da biblioteca ainda possui uma limitação conhecida relacionada
ao esquema LID: o envio tem um contorno implementado, mas algumas respostas de
pacientes podem não chegar ao evento de recebimento. Nesses casos, a confirmação
da consulta deve ser feita manualmente no Portal. Consulte
[`DEPLOY_WINDOWS.md`](DEPLOY_WINDOWS.md) antes de diagnosticar ou alterar essa
integração.

## Documentação adicional

- [`documentos/entregaveis/01-Portal-ISG-Documento-de-Requisitos.docx`](documentos/entregaveis/01-Portal-ISG-Documento-de-Requisitos.docx)
- [`documentos/entregaveis/02-Portal-ISG-Arquitetura-e-Design.docx`](documentos/entregaveis/02-Portal-ISG-Arquitetura-e-Design.docx)
- [`documentos/entregaveis/03-Portal-ISG-Manual-do-Usuario.docx`](documentos/entregaveis/03-Portal-ISG-Manual-do-Usuario.docx)
- [`documentos/entregaveis/04-Portal-ISG-Manual-Tecnico-e-Guia-de-Implantacao.docx`](documentos/entregaveis/04-Portal-ISG-Manual-Tecnico-e-Guia-de-Implantacao.docx)

## Licença

Este repositório não possui uma licença de código aberto. O backend está marcado
como `UNLICENSED`; portanto, o uso, a cópia, a modificação e a distribuição
dependem de autorização dos responsáveis pelo projeto.

## Créditos

Projeto desenvolvido pela equipe **ISG Online - Consultoria de Tecnologia da
Informação e Desenvolvimento** para a **Clínica ISG - Instituto de Saúde de
Guarapuava**.

- **Caio Biegai Rodrigues Ferreira** - Product Owner e desenvolvimento;
- **Luiz Henrique de Almeida** - Scrum Master e desenvolvimento.

Repositório: [Dark-Wolf-97/Projeto_de_Extensao](https://github.com/Dark-Wolf-97/Projeto_de_Extensao)
