# 📅 Guia Completo: Integração CRUD com Google Agenda

Este documento contém o passo a passo de como obter as credenciais necessárias para conectar a aplicação da sua clínica ao Google Calendar via API de forma **100% gratuita**, permitindo salvar múltiplos agendamentos no mesmo horário.

## Variáveis de Ambiente Necessárias
Ao final deste tutorial, você terá as seguintes informações para preencher no seu arquivo `.env`:

```env
GOOGLE_CALENDAR_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
```

---

## Passo 1: Pegar o `GOOGLE_CALENDAR_ID`
Essa é a identificação da agenda onde as consultas serão salvas.

1. Abra o [Google Agenda](https://calendar.google.com/) no seu navegador, logado na conta da clínica.
2. Clique no **ícone de engrenagem** (Configurações) no canto superior direito e vá em **Configurações**.
3. No menu lateral esquerdo, role para baixo até achar a seção **"Configurações das minhas agendas"** e clique na agenda que você quer usar.
4. Role a tela principal para baixo até encontrar a seção **Integrar agenda**.
5. Copie o que estiver no campo **ID da agenda**.
   > **Nota:** Se for a agenda principal da conta, o ID será o próprio e-mail da clínica. Se for uma agenda secundária, será um código longo terminando em `@group.calendar.google.com`.

---

## Passo 2: Criar o Projeto e Ativar a API no Google Cloud
Para gerar as chaves, precisamos criar um "robô" (Service Account) no painel de desenvolvedores do Google.

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/) e faça login.
2. No topo da tela (ao lado da logo do Google Cloud), clique em **Selecione um projeto** e depois em **Novo Projeto**. Dê um nome (ex: "Agenda Clinica") e clique em **Criar**.
3. No menu lateral esquerdo (menu de hambúrguer), vá em **APIs e Serviços > Biblioteca**.
4. Pesquise por **"Google Calendar API"**, clique nela e depois clique no botão azul **Ativar**.

---

## Passo 3: Pegar o E-mail de Serviço e a Private Key
Agora vamos criar a conta de serviço que vai manipular a agenda.

1. Ainda no Google Cloud, no menu lateral esquerdo, vá em **APIs e Serviços > Credenciais**.
2. No topo da tela, clique em **+ CRIAR CREDENCIAIS** e escolha **Conta de Serviço**.
3. Dê um nome para a conta (ex: "api-agenda") e clique em **Criar e Continuar**, depois clique em **Concluir**.
4. Na lista de "Contas de serviço" que vai aparecer na tela, você verá um e-mail gerado (parecido com `api-agenda@seu-projeto.iam.gserviceaccount.com`). 
   > 📌 **Esse e-mail é o seu `GOOGLE_SERVICE_ACCOUNT_EMAIL`**. Copie e guarde.
5. Clique em cima desse e-mail (ou no ícone de lápis) para editar a conta de serviço.
6. Vá na aba **CHAVES** (no topo da tela).
7. Clique em **Adicionar chave > Criar nova chave**.
8. Escolha o formato **JSON** e clique em **Criar**. 
9. Um arquivo `.json` será baixado para o seu computador. Abra esse arquivo no Bloco de Notas ou no seu editor de código (VS Code, etc).
10. Dentro desse arquivo, procure pela linha `"private_key"`. 
    > 🔑 **O conteúdo dessa linha é o seu `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`**. Ele começa com `-----BEGIN PRIVATE KEY-----
` e termina com `
-----END PRIVATE KEY-----
`. Copie exatamente como está ali, incluindo os `
`.

---

## ⚠️ Passo 4: Compartilhar a Agenda com o "Robô" (CRUCIAL)
Se você tentar rodar o código sem este passo, o Google retornará erro `Not Found` ou `Forbidden`. Isso acontece porque a conta de serviço (o robô) ainda não tem permissão para mexer na sua agenda.

1. Volte ao [Google Agenda](https://calendar.google.com/) da clínica.
2. Vá nas **Configurações da agenda** (mesmo lugar do Passo 1).
3. Role até a seção **"Compartilhar com pessoas ou grupos específicos"** e clique em **Adicionar pessoas e grupos**.
4. Cole o seu `GOOGLE_SERVICE_ACCOUNT_EMAIL` (o e-mail do robô do Passo 3).
5. Em **Permissões**, mude a opção para **"Fazer alterações nos eventos"** (Isso é obrigatório para realizar o CRUD).
6. Clique em **Enviar**.

---
**Pronto!** Sua aplicação agora tem as chaves e as permissões necessárias para gerenciar agendas simultâneas via API de forma gratuita!
