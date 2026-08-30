# Implantação do Portal ISG em Windows com Docker Desktop

Este guia prepara um computador Windows da clínica como servidor local. Somente
o Nginx publica portas no host (`80` e `443`). API, worker do WhatsApp e MySQL
permanecem nas redes do Docker; o MySQL usa um usuário próprio da aplicação.

## 1. Pré-requisitos do servidor

1. Instale o Docker Desktop com backend WSL2.
2. Em **Settings > General**, habilite **Start Docker Desktop when you sign in**.
3. Configure a rede do Windows como **Privada**.
4. Reserve no roteador um IP para o servidor, por exemplo `192.168.1.10`.
5. Crie no DNS interno o nome `isg.clinica.local` apontando para esse IP. Para
   um teste pequeno, o arquivo `C:\Windows\System32\drivers\etc\hosts` de cada
   computador também pode receber `192.168.1.10 isg.clinica.local`.
6. Garanta que IIS, Apache ou um `nginx.exe` instalado manualmente não esteja
   ocupando as portas `80/443`; o Nginx usado nesta implantação fica no Docker.

O Docker Desktop inicia após o login do usuário do servidor. Os containers usam
`restart: unless-stopped`, portanto voltam automaticamente depois que o Docker
estiver disponível.

## 2. Variáveis e primeira subida

No PowerShell, na raiz do projeto:

```powershell
Copy-Item .env.docker.example .env
notepad .env
```

Preencha senhas longas e diferentes para `DB_ROOT_PASSWORD` e `DB_PASSWORD`.
Mantenha `DB_USER=clinica_app`, gere um `JWT_SECRET` aleatório com pelo menos 32
bytes e ajuste `TLS_HOSTNAME` e `TLS_IP_ADDRESS` antes da primeira subida. O
arquivo `.env` é ignorado pelo Git e não deve ser enviado a ninguém.

Suba os quatro serviços:

```powershell
docker compose up --build -d
docker compose ps
```

O Nginx compila e serve o frontend estático. Não existe `npm run dev` no
servidor. A API executa as migrações antes de iniciar; o worker aguarda API e
banco saudáveis antes de conectar o WhatsApp.

## 3. HTTPS local confiável

Na primeira inicialização, o frontend cria uma autoridade certificadora local e
um certificado para o hostname/IP do `.env`, ambos no volume persistente
`tls_certs`. Exporte apenas o certificado público da autoridade:

```powershell
docker compose cp frontend:/etc/nginx/certs/portal-ca.crt .\portal-ca.crt
```

Copie `portal-ca.crt` para cada computador cliente e, em PowerShell executado
como administrador, instale-o no repositório de autoridades raiz:

```powershell
Import-Certificate -FilePath .\portal-ca.crt -CertStoreLocation Cert:\LocalMachine\Root
```

Depois acesse `https://isg.clinica.local` ou o IP configurado em
`TLS_IP_ADDRESS`. A chave privada da autoridade nunca deve sair do volume.
Se hostname ou IP mudarem, gere um novo conjunto de certificados em uma janela
de manutenção e reinstale a nova autoridade nos clientes.

Para uso externo com domínio público, substitua os arquivos `portal.crt` e
`portal.key` do volume por um certificado emitido por uma autoridade pública;
não publique o Portal diretamente na Internet sem uma revisão adicional de
segurança, VPN e política de acesso.

## 4. Firewall do Windows

Execute como administrador e limite as regras ao perfil privado e à sub-rede
local:

```powershell
New-NetFirewallRule -DisplayName 'Portal ISG HTTP (rede privada)' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 80 -Profile Private -RemoteAddress LocalSubnet
New-NetFirewallRule -DisplayName 'Portal ISG HTTPS (rede privada)' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 443 -Profile Private -RemoteAddress LocalSubnet
```

Não crie regras para `3000` ou `3306`. Confirme em outro computador que apenas
`80/443` respondem e use preferencialmente HTTPS.

## 5. Usuários iniciais e segredos externos

Preencha temporariamente no `.env` somente as variáveis do perfil que deseja
criar e execute:

```powershell
docker compose exec api node dist/src/seed.js
```

Remova do `.env` as senhas `ADMIN_PASSWORD`, `SECRETARIA_PASSWORD` e
`MEDICO_PASSWORD` logo depois e recrie a API:

```powershell
docker compose up -d --force-recreate api
```

As credenciais da conta de serviço do Google Calendar também ficam apenas no
`.env`. Nunca copie o JSON da conta de serviço para o repositório.

## 6. WhatsApp

Entre como `ADMIN`, abra **Configurações** e conecte o WhatsApp. O QR Code só é
servido nessa rota administrativa autenticada. A sessão `LocalAuth` fica no
volume `whatsapp_session`; reinícios normais não exigem novo QR.

`whatsapp-web.js` é uma integração não oficial. Ela pode parar com mudanças do
WhatsApp e existe risco de bloqueio; delays e limites não eliminam esse risco.
Na limitação LID conhecida da versão atual, o envio funciona pelo contorno já
implementado, mas respostas recebidas podem não disparar o evento da biblioteca.
Por isso a confirmação manual continua disponível.

## 7. Backup diário

Escolha outro disco ou um compartilhamento NAS, por exemplo
`E:\Backups\PortalISG`. Como os arquivos contêm dados clínicos, restrinja o
acesso à conta responsável pelo backup e use armazenamento criptografado (por
exemplo, BitLocker no disco de destino ou criptografia equivalente no NAS).

Antes de agendar, teste uma execução manual:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\deploy\backup-database.ps1 -Destino 'E:\Backups\PortalISG' -RetencaoDias 30
```

O script executa `mysqldump` dentro do container com o usuário da aplicação,
compacta e testa o arquivo antes de copiá-lo para o destino. A cópia só recebe o
nome final depois de concluída e ganha um arquivo `.sha256` para conferência de
integridade. Ele falha se o dump, a compactação ou a cópia falhar. Depois de um
backup novo bem-sucedido, remove apenas os backups `portal-isg-*.sql.gz` desse
destino com mais de 30 dias. Use `-RetencaoDias 0` para não excluir nenhum.

Instale ou atualize a tarefa diária das 23:00 usando a mesma conta que executa o
Docker Desktop:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\deploy\install-backup-task.ps1 -Destino 'E:\Backups\PortalISG' -Horario '23:00' -RetencaoDias 30
```

O instalador cria a tarefa `Portal ISG - Backup do banco` com **Executar somente
quando o usuário estiver conectado**, pois o Docker Desktop desta implantação
depende da sessão desse usuário. Se o horário for perdido, a tarefa inicia assim
que possível; execuções simultâneas são bloqueadas.

Confirme a configuração e o último resultado com:

```powershell
Get-ScheduledTask -TaskName 'Portal ISG - Backup do banco'
Get-ScheduledTaskInfo -TaskName 'Portal ISG - Backup do banco'
```

No segundo comando, `LastTaskResult` igual a `0` indica sucesso. Confirme também
que existem, no destino, pares `.sql.gz` e `.sql.gz.sha256` recentes e com
tamanho maior que zero. Um backup no mesmo computador protege contra perda do
volume Docker, mas não contra falha física, furto ou ransomware; mantenha ao
menos uma cópia adicional, criptografada e isolada do servidor.

Teste a restauração pelo menos uma vez em um banco temporário, nunca por cima da
base de produção. Um roteiro seguro é copiar um backup para o container, criar
`clinica_restore_test`, restaurar usando o usuário `root` apenas nessa operação e
listar as tabelas restauradas:

```powershell
$backup = Get-ChildItem 'E:\Backups\PortalISG\portal-isg-*.sql.gz' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$hashEsperado = (Get-Content "$($backup.FullName).sha256").Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)[0]
$hashAtual = (Get-FileHash -LiteralPath $backup.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
if ($hashAtual -ne $hashEsperado) { throw 'Checksum do backup inválido.' }
docker compose cp $backup.FullName mysql:/tmp/restore-test.sql.gz
docker compose exec -T mysql sh -c 'mysql --user=root --password="$MYSQL_ROOT_PASSWORD" -e "CREATE DATABASE clinica_restore_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"'
docker compose exec -T mysql sh -c 'gzip -dc /tmp/restore-test.sql.gz | mysql --user=root --password="$MYSQL_ROOT_PASSWORD" clinica_restore_test'
docker compose exec -T mysql sh -c 'mysql --user=root --password="$MYSQL_ROOT_PASSWORD" -e "SHOW TABLES FROM clinica_restore_test"'
```

Depois de conferir o resultado e registrar a evidência, remova manualmente
somente o banco temporário `clinica_restore_test`. Não automatize a restauração
nem o descarte da base de teste sem uma conferência humana.

## 8. Operação e atualização

```powershell
docker compose ps
docker compose logs --tail 200 api
docker compose logs --tail 200 whatsapp-worker
docker compose pull
docker compose up --build -d
```

Os logs têm rotação local e não devem conter senhas, tokens ou conteúdo de
prontuário. Antes de atualizar, faça backup; depois valide login, pacientes,
consultas, prontuários, Google Calendar e estado do WhatsApp.
