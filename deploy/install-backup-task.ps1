param(
  [Parameter(Mandatory = $true)]
  [ValidateNotNullOrEmpty()]
  [string]$Destino,

  [ValidatePattern('^(?:[01]\d|2[0-3]):[0-5]\d$')]
  [string]$Horario = '23:00',

  [ValidateRange(0, 3650)]
  [int]$RetencaoDias = 0,

  [ValidateNotNullOrEmpty()]
  [string]$NomeTarefa = 'Portal ISG - Backup do banco'
)

$ErrorActionPreference = 'Stop'

if ($env:OS -ne 'Windows_NT') {
  throw 'Este instalador usa o Agendador de Tarefas e só pode ser executado no Windows.'
}

if (-not [System.IO.Path]::IsPathRooted($Destino)) {
  throw 'Destino deve ser um caminho absoluto, de preferência em outro disco ou NAS.'
}

$raizProjeto = Split-Path -Parent $PSScriptRoot
$scriptBackup = Join-Path $PSScriptRoot 'backup-database.ps1'
$destinoResolvido = [System.IO.Path]::GetFullPath($Destino)
$executavelPowerShell = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$horarioConvertido = [datetime]::ParseExact(
  $Horario,
  'HH:mm',
  [System.Globalization.CultureInfo]::InvariantCulture
)

if (-not (Test-Path -LiteralPath $scriptBackup)) {
  throw "Script de backup não encontrado em $scriptBackup"
}

if (-not (Test-Path -LiteralPath (Join-Path $raizProjeto '.env'))) {
  throw "Arquivo .env não encontrado em $raizProjeto"
}

New-Item -ItemType Directory -Force -Path $destinoResolvido | Out-Null

$argumentos = '-NoProfile -NonInteractive -ExecutionPolicy Bypass ' +
  "-File `"$scriptBackup`" -Destino `"$destinoResolvido`" -RetencaoDias $RetencaoDias"
$acao = New-ScheduledTaskAction -Execute $executavelPowerShell -Argument $argumentos -WorkingDirectory $raizProjeto
$gatilho = New-ScheduledTaskTrigger -Daily -At $horarioConvertido
$configuracoes = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -ExecutionTimeLimit (New-TimeSpan -Hours 2) `
  -MultipleInstances IgnoreNew
$usuarioAtual = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$principal = New-ScheduledTaskPrincipal -UserId $usuarioAtual -LogonType Interactive -RunLevel Limited

Register-ScheduledTask `
  -TaskName $NomeTarefa `
  -Action $acao `
  -Trigger $gatilho `
  -Settings $configuracoes `
  -Principal $principal `
  -Description 'Backup periódico do MySQL do Portal ISG com mysqldump.' `
  -Force | Out-Null

Write-Output "Tarefa '$NomeTarefa' configurada para executar diariamente às $Horario."
Write-Output "Destino: $destinoResolvido"
Write-Output "Retenção: $(if ($RetencaoDias -eq 0) { 'sem exclusão automática' } else { "$RetencaoDias dia(s)" })"
Write-Output "Conta: $usuarioAtual (a sessão precisa estar conectada e o Docker Desktop, em execução)."
Write-Output "Faça agora o teste manual descrito em DEPLOY_WINDOWS.md e confira o código de retorno da tarefa."
