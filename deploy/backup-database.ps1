param(
  [Parameter(Mandatory = $true)]
  [ValidateNotNullOrEmpty()]
  [string]$Destino,

  [ValidateRange(0, 3650)]
  [int]$RetencaoDias = 0
)

$ErrorActionPreference = 'Stop'
$raizProjeto = Split-Path -Parent $PSScriptRoot

if (-not [System.IO.Path]::IsPathRooted($Destino)) {
  throw 'Destino deve ser um caminho absoluto, de preferência em outro disco ou NAS.'
}

$destinoResolvido = [System.IO.Path]::GetFullPath($Destino)
$arquivoTemporarioContainer = '/tmp/portal-isg-backup.sql.gz'
$carimbo = Get-Date -Format 'yyyyMMdd-HHmmss'
$arquivoFinal = Join-Path $destinoResolvido "portal-isg-$carimbo.sql.gz"
$arquivoParcial = "$arquivoFinal.partial"
$arquivoChecksum = "$arquivoFinal.sha256"

if (-not (Test-Path -LiteralPath (Join-Path $raizProjeto '.env'))) {
  throw "Arquivo .env não encontrado em $raizProjeto"
}

New-Item -ItemType Directory -Force -Path $destinoResolvido | Out-Null

Push-Location $raizProjeto
try {
  & docker compose exec -T mysql sh -c 'set -eu; mysqldump --single-transaction --quick --routines --triggers --events --hex-blob --no-tablespaces --set-gtid-purged=OFF --default-character-set=utf8mb4 --user="$MYSQL_USER" --password="$MYSQL_PASSWORD" "$MYSQL_DATABASE" > /tmp/portal-isg-backup.sql; gzip -f /tmp/portal-isg-backup.sql; gzip -t /tmp/portal-isg-backup.sql.gz'
  if ($LASTEXITCODE -ne 0) {
    throw 'O mysqldump falhou; nenhum backup foi copiado.'
  }

  & docker compose cp "mysql:$arquivoTemporarioContainer" $arquivoParcial
  if ($LASTEXITCODE -ne 0) {
    throw 'O Docker não conseguiu copiar o backup para o destino.'
  }

  $arquivo = Get-Item -LiteralPath $arquivoParcial
  if ($arquivo.Length -le 0) {
    throw 'O arquivo de backup foi criado vazio.'
  }

  Move-Item -LiteralPath $arquivoParcial -Destination $arquivoFinal
  $arquivo = Get-Item -LiteralPath $arquivoFinal
  $hash = (Get-FileHash -LiteralPath $arquivoFinal -Algorithm SHA256).Hash.ToLowerInvariant()
  "$hash  $($arquivo.Name)" | Set-Content -LiteralPath $arquivoChecksum -Encoding ascii

  $quantidadeRemovida = 0
  if ($RetencaoDias -gt 0) {
    $limiteRetencao = (Get-Date).AddDays(-$RetencaoDias)
    $backupsExpirados = Get-ChildItem -LiteralPath $destinoResolvido -File -Filter 'portal-isg-*.sql.gz' |
      Where-Object { $_.LastWriteTime -lt $limiteRetencao }

    foreach ($backupExpirado in $backupsExpirados) {
      Remove-Item -LiteralPath $backupExpirado.FullName -Force
      $checksumExpirado = "$($backupExpirado.FullName).sha256"
      if (Test-Path -LiteralPath $checksumExpirado) {
        Remove-Item -LiteralPath $checksumExpirado -Force
      }
      $quantidadeRemovida++
    }
  }

  Write-Output "Backup concluído: $($arquivo.FullName) ($($arquivo.Length) bytes; SHA-256: $hash)"
  if ($RetencaoDias -eq 0) {
    Write-Output 'Retenção automática desabilitada.'
  }
  else {
    Write-Output "Retenção: $RetencaoDias dia(s); $quantidadeRemovida backup(s) expirado(s) removido(s)."
  }
}
finally {
  if (Test-Path -LiteralPath $arquivoParcial) {
    Remove-Item -LiteralPath $arquivoParcial -Force
  }
  & docker compose exec -T mysql rm -f /tmp/portal-isg-backup.sql $arquivoTemporarioContainer 2>$null
  Pop-Location
}
