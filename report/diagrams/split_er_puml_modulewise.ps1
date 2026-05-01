$ErrorActionPreference = 'Stop'

$sourceFile = '.\report\diagrams\UEORMS_FULL_CLASS_DIAGRAM.puml'
$outDir = '.\report\diagrams\er_module_wise'

if (-not (Test-Path $sourceFile)) {
  throw "Source file not found: $sourceFile"
}

if (-not (Test-Path $outDir)) {
  New-Item -ItemType Directory -Path $outDir | Out-Null
}

$raw = Get-Content -Path $sourceFile -Raw
$lines = $raw -split "`r?`n"

$firstPackageIndex = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
  if ($lines[$i] -match '^\s*package\s+"([^"]+)"\s*\{\s*$') {
    $firstPackageIndex = $i
    break
  }
}

if ($firstPackageIndex -lt 0) {
  throw 'No package blocks found in source PUML.'
}

$preamble = @()
if ($firstPackageIndex -gt 0) {
  $preamble = $lines[0..($firstPackageIndex - 1)]
}

$packages = @()
$i = $firstPackageIndex
while ($i -lt $lines.Count) {
  $line = $lines[$i]
  if ($line -match '^\s*package\s+"([^"]+)"\s*\{\s*$') {
    $packageName = $matches[1]
    $block = @()
    $depth = 0

    while ($i -lt $lines.Count) {
      $current = $lines[$i]
      $block += $current

      $openCount = ([regex]::Matches($current, '\{')).Count
      $closeCount = ([regex]::Matches($current, '\}')).Count
      $depth += $openCount - $closeCount

      $i++
      if ($depth -eq 0) {
        break
      }
    }

    $packages += [PSCustomObject]@{
      Name = $packageName
      Lines = $block
    }
    continue
  }

  $i++
}

$relationRegex = '^\s*([A-Za-z_][A-Za-z0-9_]*)\s+"[^"]+"\s+-->\s+"[^"]+"\s+([A-Za-z_][A-Za-z0-9_]*)(\s*:\s*.*)?$'
$allRelations = @()
foreach ($line in $lines) {
  if ($line -match $relationRegex) {
    $allRelations += [PSCustomObject]@{
      Source = $matches[1]
      Target = $matches[2]
      Line = $line
    }
  }
}

function Get-SafeName {
  param([string]$name)
  $safe = $name -replace '[^A-Za-z0-9 ]', ''
  $safe = $safe.Trim() -replace '\s+', '_'
  if ([string]::IsNullOrWhiteSpace($safe)) {
    return 'Module'
  }
  return $safe
}

$summary = @()
foreach ($pkg in $packages) {
  $classNames = New-Object 'System.Collections.Generic.HashSet[string]'

  foreach ($l in $pkg.Lines) {
    if ($l -match '^\s*class\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{') {
      [void]$classNames.Add($matches[1])
    }
  }

  $internalRelations = New-Object 'System.Collections.Generic.List[string]'
  foreach ($rel in $allRelations) {
    if ($classNames.Contains($rel.Source) -and $classNames.Contains($rel.Target)) {
      $internalRelations.Add($rel.Line)
    }
  }

  $safeName = Get-SafeName -name $pkg.Name
  $diagramId = "UEORMS_ER_$safeName"
  $targetPath = Join-Path $outDir "$diagramId.puml"

  $output = New-Object 'System.Collections.Generic.List[string]'
  $output.Add("@startuml $diagramId")
  foreach ($pl in $preamble) {
    if ($pl -match '^\s*@startuml\b' -or $pl -match '^\s*@enduml\b') {
      continue
    }
    if ($pl -match '^\s*title\s+') {
      $output.Add("title UEORMS ER Diagram - $($pkg.Name)")
      continue
    }
    $output.Add($pl)
  }

  if (-not ($output -contains "title UEORMS ER Diagram - $($pkg.Name)")) {
    $output.Add("title UEORMS ER Diagram - $($pkg.Name)")
  }

  $output.Add('')
  foreach ($bl in $pkg.Lines) {
    $output.Add($bl)
  }

  if ($internalRelations.Count -gt 0) {
    $output.Add('')
    $output.Add("' Internal relationships for module: $($pkg.Name)")
    foreach ($r in $internalRelations) {
      $output.Add($r)
    }
  }

  $output.Add('@enduml')

  Set-Content -Path $targetPath -Value $output -Encoding UTF8

  $summary += [PSCustomObject]@{
    Module = $pkg.Name
    Classes = $classNames.Count
    Relations = $internalRelations.Count
    File = $targetPath
  }
}

$summaryPath = Join-Path $outDir 'README.md'
$summaryLines = @(
  '# UEORMS Module-wise ER Diagrams',
  '',
  "Source: $sourceFile",
  "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
  '',
  '| Module | Classes | Internal Relationships | File |',
  '|---|---:|---:|---|'
)

foreach ($s in $summary) {
  $relativeFile = $s.File.Replace((Resolve-Path '.').Path + '\\', '')
  $summaryLines += "| $($s.Module) | $($s.Classes) | $($s.Relations) | $relativeFile |"
}

Set-Content -Path $summaryPath -Value $summaryLines -Encoding UTF8

Write-Output "Source: $sourceFile"
Write-Output "Modules generated: $($summary.Count)"
Write-Output "Output folder: $outDir"
Write-Output "Summary: $summaryPath"
$summary | Format-Table -AutoSize | Out-String | Write-Output
