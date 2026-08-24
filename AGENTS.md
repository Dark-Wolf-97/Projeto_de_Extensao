# Portal ISG — instruções para agentes

## Contexto do projeto

Este repositório contém um sistema de gestão para clínica:

- `frontend/`: React 18, Vite, TypeScript, Tailwind e Vitest.
- `backend/`: NestJS, TypeScript, Prisma 7, MariaDB/MySQL e Jest.
- `docker-compose.yml`: execução local integrada.
- `backend/prisma/`: schema e migrações do banco.

Os textos da interface e as mensagens de negócio devem permanecer em português do Brasil.

## Forma de trabalhar

- Antes de editar, leia este arquivo, inspecione `git status` e preserve alterações existentes do usuário.
- Para tarefas com várias partes, faça um plano curto e então implemente até concluir; não pare apenas no plano.
- Prefira mudanças pequenas, coerentes com a arquitetura atual e fáceis de revisar.
- Não troque de branch, não faça commit e não envie `push` sem solicitação explícita.
- Não adicione dependências de produção sem necessidade clara. Explique qualquer dependência nova no relatório final.
- Nunca versionar `node_modules`, builds, cobertura, arquivos `.env`, credenciais, sessões ou arquivos gerados por ferramentas.
- Ao terminar, revise o diff e informe arquivos alterados, validações executadas e qualquer bloqueio real.

## Regras de segurança e dados clínicos

- Trate prontuários e dados clínicos como dados sensíveis.
- A role `SECRETARIA` não pode acessar conteúdo de prontuário.
- A role `MEDICO` só pode listar, consultar ou alterar prontuários das próprias consultas.
- A role `ADMIN` pode administrar prontuários, salvo instrução diferente na tarefa.
- A autorização deve existir no backend; esconder botões no frontend não é controle de acesso.
- Não registrar senhas, tokens, conteúdo de prontuário ou dados pessoais desnecessários nos logs.
- Não criar senhas padrão fracas nem credenciais fixas no código. Use variáveis de ambiente.
- Não usar exclusão em cascata para histórico médico. Quando houver vínculos, retornar conflito de negócio com mensagem clara.
- Não alterar nem apagar migrações históricas e não executar operações destrutivas de banco sem autorização explícita.

## Convenções do backend

- Preserve a organização NestJS por módulos, controllers, services e DTOs.
- Valide entradas com DTOs e `class-validator`.
- Aplique autenticação e roles nos endpoints e reforce ownership no service/consulta Prisma.
- Responda com exceções HTTP adequadas: 403 para acesso proibido, 404 para recurso inexistente e 409 para exclusão bloqueada por relacionamento.
- Ao alterar regras de autorização ou negócio, crie ou atualize testes unitários que cubram sucesso e negação.
- Gere o Prisma Client antes de compilar ou testar em uma instalação limpa.

## Convenções do frontend

- Mantenha TypeScript sem erros; não use `any`, `@ts-ignore` ou casts inseguros apenas para silenciar o compilador.
- Preserve os componentes e o padrão visual existentes.
- Não deixe mocks, fallbacks falsos ou mensagens de sucesso simuladas no fluxo de produção.
- Exiba ao usuário mensagens de erro úteis retornadas pela API quando forem seguras.
- Testes devem verificar comportamento e nomes acessíveis, evitando contagens frágeis de botões ou dependência excessiva da estrutura do DOM.
- A URL da API deve funcionar no navegador de outra máquina da rede. Prefira acesso relativo por `/api` com proxy reverso no Nginx.

## WhatsApp

- Z-API não faz mais parte da solução.
- A integração usa `whatsapp-web.js` (`backend/src/whatsapp/`) e sessão persistente com `LocalAuth` em volume local protegido (`WHATSAPP_SESSION_PATH`).
- Não implemente a integração de WhatsApp quando a tarefa estiver limitada à estabilização do Bloco 1.
- Nunca afirmar que a automação elimina o risco de bloqueio da conta; deixar limitações operacionais documentadas.
- **Limitação conhecida (24/08/2026):** o WhatsApp mudou o esquema interno de identificação de contatos (sistema "LID") e o `whatsapp-web.js` v1.34.7 (a versão publicada no npm mais recente) ainda não tem correção para isso. Efeitos observados em teste real:
  - Envio de mensagem: `client.sendMessage` com `numero@c.us` falha com `Error: No LID for user`. Contornado resolvendo o contato antes com `client.getNumberId()` (`WhatsappService.enviarTexto`) — funciona.
  - Recebimento de mensagem: o evento `message` do client simplesmente não dispara para contas afetadas pelo LID — sem erro, sem log, o evento não chega. **Sem contorno conhecido no momento.** Isso quebra a confirmação automática por resposta do paciente (US007): a mensagem sai normalmente, mas a resposta "sim" do paciente não confirma a consulta sozinha.
  - Por decisão do usuário, a confirmação continua manual (botão "Confirmar" já existente em Consultas) até a lib publicar correção. Não remova a lógica de `MensagensService.processarMensagemRecebida`/`WhatsappService.onInboundMessage` — ela já está correta e volta a funcionar sozinha assim que a lib corrigir o evento `message`, sem precisar mudar nada aqui.
  - Ver issues públicas da lib sobre "No LID for user" antes de tentar mexer nisso de novo; não presuma que é bug no código do Portal.
- **Limitação conhecida no Windows:** quando o aparelho é desvinculado pelo celular (ou em qualquer logout), `whatsapp-web.js` dispara `LocalAuth.logout()` de dentro de um listener interno de navegação do Puppeteer — fora de qualquer request nosso, então não dá pra envolver com try/catch no código da aplicação. No Windows isso às vezes falha com `EBUSY: resource busy or locked` ao apagar os arquivos de sessão, porque o Chromium ainda está com o arquivo aberto, e vira uma rejeição de Promise não tratada que derrubaria o processo inteiro. Por isso `backend/src/main.ts` registra `process.on('unhandledRejection'/'uncaughtException')` só pra logar e não deixar isso ser fatal — não remova esse handler achando que é código morto. Também aumentamos `rmMaxRetries` do `LocalAuth` (`whatsapp.constants.ts`) para dar mais tentativas antes de desistir.
- `WHATSAPP_ENABLED` **não é um interruptor completo**, por decisão explícita do usuário: ele só controla se o client tenta conectar sozinho no boot (`WhatsappService.onModuleInit`). O botão "Conectar" em Configurações e o endpoint `POST /whatsapp/conectar` sempre funcionam, mesmo com `WHATSAPP_ENABLED=false`. Padrão (variável não definida) é habilitado — `true` implícito. Ver comentário em `WhatsappService.getConfig()`.

## Comandos de validação

Execute os comandos relevantes para os arquivos alterados. Para uma entrega que afete o sistema inteiro, execute todos.

### Frontend

```bash
cd frontend
npm ci
npx tsc -b --pretty false
npm run lint
npm run test:run
npm run build
```

### Backend

```bash
cd backend
npm ci
DATABASE_URL=mysql://root:root@localhost:3306/clinica_db npx prisma generate
npm run build
npm test -- --runInBand
```

### Containers

```bash
docker compose config
docker compose build
```

Se Docker, banco ou rede não estiverem disponíveis, não invente resultado: execute todas as verificações possíveis e descreva exatamente o que ficou pendente.

## Definição de pronto

Uma tarefa só está concluída quando:

- o comportamento solicitado foi implementado sem ampliar o escopo;
- typecheck, lint, testes e build relevantes passam;
- regras de acesso e falhas importantes possuem cobertura;
- não há segredo, mock de produção ou artefato gerado no diff;
- a documentação operacional afetada foi atualizada;
- o diff final foi revisado em busca de regressões e alterações acidentais.


## Documentos do projeto

Sempre que iniciar uma tarefa neste repositório, verifique a pasta `documentos/` na raiz do projeto.

Essa pasta contém fontes de verdade do projeto, como backlog, documentação funcional, validações, relatórios, decisões de escopo e materiais de integração. Antes de implementar, corrigir ou planejar qualquer bloco de trabalho:

1. Liste os arquivos disponíveis em `documentos/`.
2. Leia os documentos relevantes para a tarefa atual.
3. Use esses documentos como referência principal para entender requisitos, regras de negócio, prioridades e pendências.
4. Compare o que está no código com o que está descrito nos documentos quando a tarefa envolver backlog, validação ou entrega funcional.
5. Se houver conflito entre documentação antiga e uma instrução mais recente do usuário, siga a instrução mais recente e registre a diferença no resumo final.
6. Não altere arquivos dentro de `documentos/` sem pedido explícito.
7. Ao finalizar uma tarefa, informe quais documentos foram consultados e quais decisões foram tomadas com base neles.

Arquivos esperados nessa pasta podem incluir, entre outros:

- backlog do produto
- documentação de como fazer
- documentação de validação
- relatórios de análise do repositório
- instruções de integração
- notas de decisões técnicas

Observação importante: a integração com WhatsApp deve usar `whatsapp-web.js`. Não implementar Z-API, mesmo que documentos antigos mencionem Z-API, a menos que o usuário peça explicitamente.