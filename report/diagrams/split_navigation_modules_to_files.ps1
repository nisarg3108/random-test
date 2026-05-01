$ErrorActionPreference = 'Stop'

$sourceFile = '.\report\diagrams\UEORMS_FULL_NAVIGATION_CHART.drawio'
$outDir = '.\report\diagrams\navigation_module_wise'

if (-not (Test-Path $sourceFile)) {
  throw "Source file not found: $sourceFile"
}

if (-not (Test-Path $outDir)) {
  New-Item -ItemType Directory -Path $outDir | Out-Null
}

[xml]$src = Get-Content -Path $sourceFile -Raw
$diagram = @($src.mxfile.diagram)[0]

if ($null -eq $diagram -or $null -eq $diagram.mxGraphModel -or $null -eq $diagram.mxGraphModel.root) {
  throw 'Invalid drawio format: missing mxGraphModel/root.'
}

$allCells = @($diagram.mxGraphModel.root.mxCell)

$byId = @{}
foreach ($c in $allCells) {
  $byId[[string]$c.id] = $c
}

function Find-CellByValue {
  param(
    [array]$cells,
    [string]$value
  )

  return $cells |
    Where-Object { [string]$_.vertex -eq '1' -and [string]$_.value -eq $value } |
    Select-Object -First 1
}

function Get-OutgoingEdges {
  param(
    [array]$cells,
    [string]$sourceId
  )

  return @($cells | Where-Object { [string]$_.edge -eq '1' -and [string]$_.source -eq $sourceId })
}

function Get-SafeName {
  param([string]$name)

  $safe = $name -replace '[^A-Za-z0-9\- ]', ''
  $safe = $safe.Trim() -replace '\s+', '_'
  if ([string]::IsNullOrWhiteSpace($safe)) { $safe = 'Module' }
  return $safe
}

$inventoryNode = Find-CellByValue -cells $allCells -value 'Routed Page Inventory (111 Total)'
if ($null -eq $inventoryNode) {
  throw 'Could not find "Routed Page Inventory (111 Total)" node in source diagram.'
}

$inventoryId = [string]$inventoryNode.id
$moduleEdges = Get-OutgoingEdges -cells $allCells -sourceId $inventoryId

if ($moduleEdges.Count -eq 0) {
  throw 'No module edges found under "Routed Page Inventory (111 Total)".'
}

$moduleTargets = @()
foreach ($edge in $moduleEdges) {
  $targetId = [string]$edge.target
  if ($byId.ContainsKey($targetId)) {
    $moduleTargets += $byId[$targetId]
  }
}

$moduleTargets = $moduleTargets | Sort-Object {
  if ($_.mxGeometry -and $_.mxGeometry.y -ne $null -and $_.mxGeometry.y -ne '') { [double]$_.mxGeometry.y } else { 0 }
}, {
  if ($_.mxGeometry -and $_.mxGeometry.x -ne $null -and $_.mxGeometry.x -ne '') { [double]$_.mxGeometry.x } else { 0 }
}

$created = @()

foreach ($moduleCell in $moduleTargets) {
  $moduleId = [string]$moduleCell.id
  $moduleName = [string]$moduleCell.value

  # Traverse only the navigation tree from this module root.
  $nodeSet = New-Object System.Collections.Generic.HashSet[string]
  $edgeSet = New-Object System.Collections.Generic.HashSet[string]
  $queue = New-Object System.Collections.Generic.Queue[string]
  $queue.Enqueue($moduleId)
  $nodeSet.Add($moduleId) | Out-Null

  while ($queue.Count -gt 0) {
    $current = $queue.Dequeue()
    $outgoing = Get-OutgoingEdges -cells $allCells -sourceId $current

    foreach ($e in $outgoing) {
      $eid = [string]$e.id
      $tid = [string]$e.target

      $edgeSet.Add($eid) | Out-Null
      if (-not $nodeSet.Contains($tid)) {
        $nodeSet.Add($tid) | Out-Null
        $queue.Enqueue($tid)
      }
    }
  }

  $boundsNodes = @()
  foreach ($nid in $nodeSet) {
    if ($byId.ContainsKey($nid)) {
      $n = $byId[$nid]
      if ([string]$n.vertex -eq '1' -and $n.mxGeometry) {
        $x = if ($n.mxGeometry.x -ne $null -and $n.mxGeometry.x -ne '') { [double]$n.mxGeometry.x } else { $null }
        $y = if ($n.mxGeometry.y -ne $null -and $n.mxGeometry.y -ne '') { [double]$n.mxGeometry.y } else { $null }
        if ($null -ne $x -and $null -ne $y) {
          $boundsNodes += [pscustomobject]@{ X = $x; Y = $y }
        }
      }
    }
  }

  $minX = 0.0
  $minY = 0.0
  if ($boundsNodes.Count -gt 0) {
    $minX = ($boundsNodes | Measure-Object -Property X -Minimum).Minimum
    $minY = ($boundsNodes | Measure-Object -Property Y -Minimum).Minimum
  }

  $newDoc = New-Object System.Xml.XmlDocument
  $decl = $newDoc.CreateXmlDeclaration('1.0', 'UTF-8', $null)
  $newDoc.AppendChild($decl) | Out-Null

  $mxfile = $newDoc.CreateElement('mxfile')
  $mxfile.SetAttribute('host', 'app.diagrams.net')
  $mxfile.SetAttribute('modified', (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ'))
  $mxfile.SetAttribute('agent', 'Codex')
  $mxfile.SetAttribute('version', '24.7.17')
  $mxfile.SetAttribute('type', 'device')
  $newDoc.AppendChild($mxfile) | Out-Null

  $d = $newDoc.CreateElement('diagram')
  $d.SetAttribute('id', ('NAV-' + $moduleId))
  $d.SetAttribute('name', $moduleName)
  $mxfile.AppendChild($d) | Out-Null

  $gModel = $newDoc.CreateElement('mxGraphModel')
  $gModel.SetAttribute('dx', '1920')
  $gModel.SetAttribute('dy', '1080')
  $gModel.SetAttribute('grid', '1')
  $gModel.SetAttribute('gridSize', '10')
  $gModel.SetAttribute('guides', '1')
  $gModel.SetAttribute('tooltips', '1')
  $gModel.SetAttribute('connect', '1')
  $gModel.SetAttribute('arrows', '1')
  $gModel.SetAttribute('fold', '1')
  $gModel.SetAttribute('page', '1')
  $gModel.SetAttribute('pageScale', '1')
  $gModel.SetAttribute('pageWidth', '2200')
  $gModel.SetAttribute('pageHeight', '1800')
  $gModel.SetAttribute('math', '0')
  $gModel.SetAttribute('shadow', '0')

  $root = $newDoc.CreateElement('root')
  $gModel.AppendChild($root) | Out-Null

  $c0 = $newDoc.CreateElement('mxCell')
  $c0.SetAttribute('id', '0')
  $root.AppendChild($c0) | Out-Null

  $c1 = $newDoc.CreateElement('mxCell')
  $c1.SetAttribute('id', '1')
  $c1.SetAttribute('parent', '0')
  $root.AppendChild($c1) | Out-Null

  $title = $newDoc.CreateElement('mxCell')
  $title.SetAttribute('id', 'title')
  $title.SetAttribute('value', ('UEORMS Navigation Module: ' + $moduleName))
  $title.SetAttribute('style', 'rounded=0;whiteSpace=wrap;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingTop=6;spacingLeft=8;fontSize=16;fontStyle=1;')
  $title.SetAttribute('vertex', '1')
  $title.SetAttribute('parent', '1')
  $tg = $newDoc.CreateElement('mxGeometry')
  $tg.SetAttribute('x', '20')
  $tg.SetAttribute('y', '20')
  $tg.SetAttribute('width', '1400')
  $tg.SetAttribute('height', '40')
  $tg.SetAttribute('as', 'geometry')
  $title.AppendChild($tg) | Out-Null
  $root.AppendChild($title) | Out-Null

  foreach ($nid in $nodeSet) {
    if (-not $byId.ContainsKey($nid)) { continue }
    $orig = $byId[$nid]

    $clone = [System.Xml.XmlElement]$newDoc.ImportNode($orig, $true)
    $clone.SetAttribute('parent', '1')

    if ([string]$clone.GetAttribute('vertex') -eq '1') {
      $g = [System.Xml.XmlElement]$clone.SelectSingleNode('mxGeometry')
      if ($null -ne $g) {
        if ($g.HasAttribute('x') -and $g.GetAttribute('x') -ne '') {
          $newX = [math]::Round(([double]$g.GetAttribute('x')) - $minX + 40, 2)
          $g.SetAttribute('x', [string]$newX)
        }
        if ($g.HasAttribute('y') -and $g.GetAttribute('y') -ne '') {
          $newY = [math]::Round(([double]$g.GetAttribute('y')) - $minY + 90, 2)
          $g.SetAttribute('y', [string]$newY)
        }
      }
    }

    $root.AppendChild($clone) | Out-Null
  }

  foreach ($eid in $edgeSet) {
    if (-not $byId.ContainsKey($eid)) { continue }
    $edgeClone = [System.Xml.XmlElement]$newDoc.ImportNode($byId[$eid], $true)
    $edgeClone.SetAttribute('parent', '1')
    $root.AppendChild($edgeClone) | Out-Null
  }

  $d.AppendChild($gModel) | Out-Null

  $safeName = Get-SafeName -name $moduleName
  $fileName = "UEORMS_NAV_MODULE_${safeName}.drawio"
  $target = Join-Path $outDir $fileName
  $newDoc.Save($target)
  $created += $target
}

Write-Output "Source: $sourceFile"
Write-Output "Inventory parent: Routed Page Inventory (111 Total)"
Write-Output "Modules found: $($moduleTargets.Count)"
Write-Output "Created files: $($created.Count)"
$created | ForEach-Object { Write-Output $_ }