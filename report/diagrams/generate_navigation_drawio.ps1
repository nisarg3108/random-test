$ErrorActionPreference = 'Stop'

$src = '.\report\diagrams\UEORMS_FULL_NAVIGATION_CHART.puml'
$out = '.\report\diagrams\UEORMS_FULL_NAVIGATION_CHART.drawio'

$lines = Get-Content -Path $src
$nodes = @()
$stack = @()
$idCounter = 100

foreach ($line in $lines) {
  if ($line -match '^\s*\*+\s+(.+)$') {
    $prefix = [regex]::Match($line, '^\s*(\*+)').Groups[1].Value
    $stars = $prefix.Length
    $level = $stars - 1
    $text = $Matches[1].Trim()

    while (($stack.Count -gt 0) -and ($stack[-1].Level -ge $level)) {
      if ($stack.Count -eq 1) {
        $stack = @()
      } else {
        $stack = $stack[0..($stack.Count - 2)]
      }
    }

    $parentId = if ($stack.Count -gt 0) { $stack[-1].Id } else { '1' }
    $id = [string]$idCounter
    $idCounter++

    $nodes += [pscustomobject]@{
      Id = $id
      ParentId = $parentId
      Level = $level
      Text = $text
    }

    $stack += [pscustomobject]@{
      Id = $id
      Level = $level
    }
  }
}

$xml = New-Object System.Xml.XmlDocument
$decl = $xml.CreateXmlDeclaration('1.0', 'UTF-8', $null)
$xml.AppendChild($decl) | Out-Null

$mxfile = $xml.CreateElement('mxfile')
$mxfile.SetAttribute('host', 'app.diagrams.net')
$mxfile.SetAttribute('modified', (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ'))
$mxfile.SetAttribute('agent', 'Codex')
$mxfile.SetAttribute('version', '24.7.17')
$mxfile.SetAttribute('type', 'device')
$xml.AppendChild($mxfile) | Out-Null

$diagram = $xml.CreateElement('diagram')
$diagram.SetAttribute('id', 'UEORMS-NAV-1')
$diagram.SetAttribute('name', 'UEORMS Navigation Chart')
$mxfile.AppendChild($diagram) | Out-Null

$model = $xml.CreateElement('mxGraphModel')
$model.SetAttribute('dx', '1920')
$model.SetAttribute('dy', '1080')
$model.SetAttribute('grid', '1')
$model.SetAttribute('gridSize', '10')
$model.SetAttribute('guides', '1')
$model.SetAttribute('tooltips', '1')
$model.SetAttribute('connect', '1')
$model.SetAttribute('arrows', '1')
$model.SetAttribute('fold', '1')
$model.SetAttribute('page', '1')
$model.SetAttribute('pageScale', '1')
$model.SetAttribute('pageWidth', '30000')
$model.SetAttribute('pageHeight', '9000')
$model.SetAttribute('math', '0')
$model.SetAttribute('shadow', '0')
$diagram.AppendChild($model) | Out-Null

$root = $xml.CreateElement('root')
$model.AppendChild($root) | Out-Null

$c0 = $xml.CreateElement('mxCell')
$c0.SetAttribute('id', '0')
$root.AppendChild($c0) | Out-Null

$c1 = $xml.CreateElement('mxCell')
$c1.SetAttribute('id', '1')
$c1.SetAttribute('parent', '0')
$root.AppendChild($c1) | Out-Null

$title = $xml.CreateElement('mxCell')
$title.SetAttribute('id', 'title')
$title.SetAttribute('value', 'UEORMS Full Navigation Chart (Code-Verified)')
$title.SetAttribute('style', 'rounded=0;whiteSpace=wrap;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;fontSize=18;fontStyle=1;')
$title.SetAttribute('vertex', '1')
$title.SetAttribute('parent', '1')
$titleGeo = $xml.CreateElement('mxGeometry')
$titleGeo.SetAttribute('x', '20')
$titleGeo.SetAttribute('y', '20')
$titleGeo.SetAttribute('width', '1800')
$titleGeo.SetAttribute('height', '36')
$titleGeo.SetAttribute('as', 'geometry')
$title.AppendChild($titleGeo) | Out-Null
$root.AppendChild($title) | Out-Null

$levelRowIndex = @{}
$baseX = 40
$stepX = 360
$baseY = 80
$stepY = 72

foreach ($n in $nodes) {
  if (-not $levelRowIndex.ContainsKey($n.Level)) {
    $levelRowIndex[$n.Level] = 0
  }

  $row = [int]$levelRowIndex[$n.Level]
  $levelRowIndex[$n.Level] = $row + 1

  # Vertical hierarchy: deeper levels move downward (y), siblings spread horizontally (x)
  $x = $baseX + ($row * $stepX)
  $y = $baseY + ([int]$n.Level * $stepY)

  $cell = $xml.CreateElement('mxCell')
  $cell.SetAttribute('id', $n.Id)
  $cell.SetAttribute('value', $n.Text)
  $cell.SetAttribute('style', 'rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#666666;fontSize=11;align=left;spacingLeft=8;')
  $cell.SetAttribute('vertex', '1')
  $cell.SetAttribute('parent', '1')

  $geo = $xml.CreateElement('mxGeometry')
  $geo.SetAttribute('x', [string]$x)
  $geo.SetAttribute('y', [string]$y)
  $geo.SetAttribute('width', '340')
  $geo.SetAttribute('height', '40')
  $geo.SetAttribute('as', 'geometry')
  $cell.AppendChild($geo) | Out-Null

  $root.AppendChild($cell) | Out-Null
}

$edgeId = 10000
foreach ($n in $nodes) {
  if ($n.ParentId -ne '1') {
    $edge = $xml.CreateElement('mxCell')
    $edge.SetAttribute('id', [string]$edgeId)
    $edgeId++
    $edge.SetAttribute('value', '')
    $edge.SetAttribute('style', 'edgeStyle=orthogonalEdgeStyle;rounded=0;endArrow=none;strokeColor=#999999;html=1;')
    $edge.SetAttribute('edge', '1')
    $edge.SetAttribute('parent', '1')
    $edge.SetAttribute('source', $n.ParentId)
    $edge.SetAttribute('target', $n.Id)

    $edgeGeo = $xml.CreateElement('mxGeometry')
    $edgeGeo.SetAttribute('relative', '1')
    $edgeGeo.SetAttribute('as', 'geometry')
    $edge.AppendChild($edgeGeo) | Out-Null

    $root.AppendChild($edge) | Out-Null
  }
}

$xml.Save($out)
Write-Output "Created: $out"
Write-Output "NodeCount: $($nodes.Count)"
Write-Output "EdgeCount: $($nodes.Count - ($nodes | Where-Object { $_.ParentId -eq '1' }).Count)"
