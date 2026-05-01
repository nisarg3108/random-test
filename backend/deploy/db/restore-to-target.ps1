param(
  [Parameter(Mandatory = $true)]
  [string]$TargetDatabaseUrl,

  [Parameter(Mandatory = $false)]
  [string]$BackupFile
)

$ErrorActionPreference = 'Stop'

function Get-LatestBackupFile {
  $files = Get-ChildItem -Path ".\\deploy\\db" -Filter "*.dump" -File | Sort-Object LastWriteTime -Descending
  if (-not $files -or $files.Count -eq 0) {
    throw "No .dump file found in backend/deploy/db."
  }
  return $files[0].FullName
}

function Parse-PgUrl {
  param([string]$Url)

  $uri = [Uri]$Url
  $parts = $uri.UserInfo.Split(':')

  if ($parts.Length -lt 2) {
    throw "Invalid PostgreSQL URL: missing username or password."
  }

  $port = $uri.Port
  if ($port -lt 0) { $port = 5432 }
  
  return [PSCustomObject]@{
    Host = $uri.Host
    Port = $port
    Database = $uri.AbsolutePath.TrimStart('/')
    User = [System.Uri]::UnescapeDataString($parts[0])
    Password = [System.Uri]::UnescapeDataString($parts[1])
  }
}

if (-not $BackupFile -or $BackupFile.Trim() -eq '') {
  $BackupFile = Get-LatestBackupFile
}

if (-not (Test-Path $BackupFile)) {
  throw "Backup file not found: $BackupFile"
}

$target = Parse-PgUrl -Url $TargetDatabaseUrl

Write-Output "Restoring backup into target database..."
Write-Output ("Target host: " + $target.Host)
Write-Output ("Target port: " + $target.Port)
Write-Output ("Target db: " + $target.Database)
Write-Output ("Backup file: " + $BackupFile)

$env:PGPASSWORD = $target.Password

$pgRestoreArgs = @(
  '-h', $target.Host,
  '-p', "$($target.Port)",
  '-U', $target.User,
  '-d', $target.Database,
  '--clean',
  '--if-exists',
  '--no-owner',
  '--no-privileges',
  '--verbose',
  $BackupFile
)

& "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" @pgRestoreArgs

$exitCode = $LASTEXITCODE
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

if ($exitCode -ne 0) {
  throw "pg_restore failed with exit code $exitCode"
}

Write-Output "Restore completed successfully."
