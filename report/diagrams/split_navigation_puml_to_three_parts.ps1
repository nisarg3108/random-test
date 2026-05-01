$ErrorActionPreference = 'Stop'

$sourceFile = '.\report\diagrams\UEORMS_FULL_NAVIGATION_CHART.puml'
$outDir = '.\report\diagrams\navigation_3_parts'

if (-not (Test-Path $sourceFile)) {
  throw "Source file not found: $sourceFile"
}

if (-not (Test-Path $outDir)) {
  New-Item -ItemType Directory -Path $outDir | Out-Null
}

$lines = Get-Content -Path $sourceFile

$headerLines = @()
$rootLine = $null

foreach ($line in $lines) {
  if ($line -match '^\* UEORMS Navigation Chart\s*$') {
    $rootLine = $line
    break
  }
  if ($line -notmatch '^@startmindmap' -and $line -notmatch '^@endmindmap') {
    $headerLines += $line
  }
}

if ($null -eq $rootLine) {
  throw 'Could not find root line: * UEORMS Navigation Chart'
}

# Collect top-level section blocks (lines starting with ** and all descendants).
$sectionBlocks = @{}
$currentSection = $null

foreach ($line in $lines) {
  if ($line -match '^\*\*\s+(.+)$') {
    $currentSection = $Matches[1].Trim()
    $sectionBlocks[$currentSection] = @($line)
    continue
  }

  if ($null -ne $currentSection) {
    if ($line -match '^\*\*\*' -or $line -match '^\*\*\*\*' -or $line -match '^\*\*\*\*\*') {
      $sectionBlocks[$currentSection] += $line
    }
  }
}

$parts = @(
  [pscustomobject]@{
    Number = 1
    Name = 'Access and Navigation Foundations'
    Title = 'UEORMS Navigation Chart - Part 1: Access and Navigation Foundations'
    Sections = @(
      'Evidence Sources (Current System)',
      'Entry and Access Flow',
      'Dashboard Hub',
      'Sidebar Menu Resolution'
    )
  },
  [pscustomobject]@{
    Number = 2
    Name = 'Routed Pages and Aliases'
    Title = 'UEORMS Navigation Chart - Part 2: Routed Pages and Aliases'
    Sections = @(
      'Routed Page Inventory (111 Total)',
      'Route Alias Notes'
    )
  },
  [pscustomobject]@{
    Number = 3
    Name = 'Backend Alignment and Session'
    Title = 'UEORMS Navigation Chart - Part 3: Backend Alignment and Session'
    Sections = @(
      'Backend API Alignment (Navigation Target Context)',
      'Session Exit'
    )
  }
)

$created = @()

foreach ($part in $parts) {
  $outLines = @()
  $outLines += "@startmindmap UEORMS_Navigation_Part_$($part.Number)"

  foreach ($h in $headerLines) {
    if ($h -match '^title\s+') {
      $outLines += "title $($part.Title)"
    } else {
      $outLines += $h
    }
  }

  $outLines += ''
  $outLines += $rootLine

  foreach ($section in $part.Sections) {
    if ($sectionBlocks.ContainsKey($section)) {
      $outLines += $sectionBlocks[$section]
    }
  }

  $outLines += ''
  $outLines += '@endmindmap'

  $fileName = "UEORMS_NAVIGATION_Part_$($part.Number)_$($part.Name -replace '[^A-Za-z0-9 ]','' -replace '\s+','_').puml"
  $target = Join-Path $outDir $fileName
  Set-Content -Path $target -Value $outLines -Encoding UTF8
  $created += $target
}

Write-Output "Source: $sourceFile"
Write-Output "Created files: $($created.Count)"
$created | ForEach-Object { Write-Output $_ }
