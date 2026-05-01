$ErrorActionPreference = 'Stop'

$sourceFile = '.\report\diagrams\UEORMS_FULL_USE_CASE_DIAGRAM_READABLE.drawio'
$outDir = '.\report\diagrams\usecase_module_wise_drawio'

if (-not (Test-Path $sourceFile)) {
  throw "Source file not found: $sourceFile"
}

if (-not (Test-Path $outDir)) {
  New-Item -ItemType Directory -Path $outDir | Out-Null
}

[xml]$src = Get-Content -Path $sourceFile -Raw
$diagrams = @($src.mxfile.diagram)

function Get-SafeName {
  param([string]$name)

  $safe = $name -replace '^[0-9]+\s*', ''
  $safe = $safe -replace '[^A-Za-z0-9\- ]', ''
  $safe = $safe.Trim() -replace '\s+', '_'
  if ([string]::IsNullOrWhiteSpace($safe)) {
    $safe = 'Module'
  }

  return $safe
}

$created = @()
foreach ($d in $diagrams) {
  $moduleName = [string]$d.name

  # Skip overview page; export module/actors pages only.
  if ($moduleName -like '00*') {
    continue
  }

  $doc = New-Object System.Xml.XmlDocument
  $decl = $doc.CreateXmlDeclaration('1.0', 'UTF-8', $null)
  $doc.AppendChild($decl) | Out-Null

  $mxfile = $doc.CreateElement('mxfile')
  $mxfile.SetAttribute('host', 'app.diagrams.net')
  $mxfile.SetAttribute('modified', (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ'))
  $mxfile.SetAttribute('agent', 'GPT-5.3-Codex')
  $mxfile.SetAttribute('version', '24.7.17')
  $mxfile.SetAttribute('type', 'device')
  $doc.AppendChild($mxfile) | Out-Null

  $imported = $doc.ImportNode($d, $true)
  $mxfile.AppendChild($imported) | Out-Null

  $safeName = Get-SafeName -name $moduleName
  $fileName = "UEORMS_USECASE_MODULE_${safeName}.drawio"
  $target = Join-Path $outDir $fileName

  $doc.Save($target)
  $created += $target
}

Write-Output "Source: $sourceFile"
Write-Output "Pages found: $($diagrams.Count)"
Write-Output "Created files: $($created.Count)"
$created | ForEach-Object { Write-Output $_ }
