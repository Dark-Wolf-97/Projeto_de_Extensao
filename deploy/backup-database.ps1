param(
  [Parameter(Mandatory = $true)]
  [string]$Destino
)

$ErrorActionPreference = 'Stop'
$raizProjeto = Split-Path -Parent $PSScriptRoot
$destinoResolvido = [System.IO.Path]::GetFullPath($Destino)
$arquivoTemporarioContainer = '/tmp/portal-isg-backup.sql.gz'
$carimbo = Get-Date -Format 'yyyyMMdd-HHmmss'
$arquivoFinal = Join-Path $destinoResolvido "portal-isg-$carimbo.sql.gz"

if (-not (Test-Path -LiteralPath (Join-Path $raizProjeto '.env'))) {
  throw "Arquivo .env não encontrado em $raizProjeto"
}

New-Item -ItemType Directory -Force -Path $destinoResolvido | Out-Null

Push-Location $raizProjeto
try {
  & docker compose exec -T mysql sh -c 'set -eu; mysqldump --single-transaction --quick --routines --triggers --default-character-set=utf8mb4 --user="$MYSQL_USER" --password="$MYSQL_PASSWORD" "$MYSQL_DATABASE" > /tmp/portal-isg-backup.sql; gzip -f /tmp/portal-isg-backup.sql'
  if ($LASTEXITCODE -ne 0) {
    throw 'O mysqldump falhou; nenhum backup foi copiado.'
  }

  & docker compose cp "mysql:$arquivoTemporarioContainer" $arquivoFinal
  if ($LASTEXITCODE -ne 0) {
    throw 'O Docker não conseguiu copiar o backup para o destino.'
  }

  $arquivo = Get-Item -LiteralPath $arquivoFinal
  if ($arquivo.Length -le 0) {
    throw 'O arquivo de backup foi criado vazio.'
  }

  Write-Output "Backup concluído: $($arquivo.FullName) ($($arquivo.Length) bytes)"
}
finally {
  & docker compose exec -T mysql rm -f /tmp/portal-isg-backup.sql $arquivoTemporarioContainer 2>$null
  Pop-Location
}
