$ErrorActionPreference = 'Stop'

$inFile = '.\report\diagrams\UEORMS_FULL_CLASS_DIAGRAM.final.drawio'
$outFile = '.\report\diagrams\UEORMS_ALL_CLASSES_SPLIT_PARTS.drawio'
$classesPerPart = 15

[xml]$doc = Get-Content -Path $inFile -Raw
$root = $doc.mxfile.diagram.mxGraphModel.root
$cells = @($root.mxCell)

$moduleIds = 3..15 | ForEach-Object { [string]$_ }
$excludeTop = @('2') + $moduleIds

$topClasses = @(
  $cells | Where-Object {
    $_.vertex -eq '1' -and $_.parent -eq '1' -and ($excludeTop -notcontains [string]$_.id)
  }
) | Sort-Object { [int]$_.id }

$byId = @{}
foreach ($c in $cells) { $byId[[string]$c.id] = $c }

function Get-Descendants {
  param(
    [string]$parentId,
    $allCells
  )

  $kids = @($allCells | Where-Object { [string]$_.parent -eq $parentId })
  $acc = @()
  foreach ($k in $kids) {
    $acc += $k
    $acc += Get-Descendants -parentId ([string]$k.id) -allCells $allCells
  }
  return $acc
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

$total = $topClasses.Count
$partCount = [math]::Ceiling($total / $classesPerPart)

for ($part = 1; $part -le $partCount; $part++) {
  $start = ($part - 1) * $classesPerPart
  $chunk = @($topClasses | Select-Object -Skip $start -First $classesPerPart)
  if ($chunk.Count -eq 0) { continue }

  $diagram = $newDoc.CreateElement('diagram')
  $diagram.SetAttribute('id', ('PART-' + $part))
  $diagram.SetAttribute('name', ('Part {0:00} ({1} classes)' -f $part, $chunk.Count))

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
  $gModel.SetAttribute('pageWidth', '2400')
  $gModel.SetAttribute('pageHeight', '2000')
  $gModel.SetAttribute('math', '0')
  $gModel.SetAttribute('shadow', '0')

  $r = $newDoc.CreateElement('root')

  $c0 = $newDoc.CreateElement('mxCell')
  $c0.SetAttribute('id', '0')
  $r.AppendChild($c0) | Out-Null

  $c1 = $newDoc.CreateElement('mxCell')
  $c1.SetAttribute('id', '1')
  $c1.SetAttribute('parent', '0')
  $r.AppendChild($c1) | Out-Null

  $title = $newDoc.CreateElement('mxCell')
  $title.SetAttribute('id', 'title')
  $title.SetAttribute('value', ('UEORMS Class Diagram - Part {0:00} of {1} ({2} classes)' -f $part, $partCount, $chunk.Count))
  $title.SetAttribute('style', 'rounded=0;whiteSpace=wrap;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingTop=6;spacingLeft=8;fontSize=16;fontStyle=1;')
  $title.SetAttribute('vertex', '1')
  $title.SetAttribute('parent', '1')
  $tg = $newDoc.CreateElement('mxGeometry')
  $tg.SetAttribute('x', '20')
  $tg.SetAttribute('y', '20')
  $tg.SetAttribute('width', '1800')
  $tg.SetAttribute('height', '40')
  $tg.SetAttribute('as', 'geometry')
  $title.AppendChild($tg) | Out-Null
  $r.AppendChild($title) | Out-Null

  $includeIds = New-Object System.Collections.Generic.HashSet[string]

  foreach ($cls in $chunk) {
    $topId = [string]$cls.id
    $includeIds.Add($topId) | Out-Null
    $desc = Get-Descendants -parentId $topId -allCells $cells
    foreach ($dc in $desc) {
      $includeIds.Add([string]$dc.id) | Out-Null
    }
  }

  foreach ($cid in $includeIds) {
    $orig = $byId[$cid]
    if ($null -eq $orig) { continue }

    $clone = $newDoc.CreateElement('mxCell')
    foreach ($a in $orig.Attributes) {
      $clone.SetAttribute($a.Name, $a.Value)
    }

    if ([string]$clone.GetAttribute('parent') -eq '1') {
      $clone.SetAttribute('parent', '1')
    }

    if ($orig.mxGeometry) {
      $geom = $newDoc.CreateElement('mxGeometry')
      foreach ($ga in $orig.mxGeometry.Attributes) {
        $geom.SetAttribute($ga.Name, $ga.Value)
      }

      if ([string]$orig.parent -eq '1' -and [string]$orig.vertex -eq '1') {
        $ox = [double]$orig.mxGeometry.x
        $oy = [double]$orig.mxGeometry.y
        $geom.SetAttribute('x', [string][math]::Round($ox + 20, 2))
        $geom.SetAttribute('y', [string][math]::Round($oy + 60, 2))
      }

      $clone.AppendChild($geom) | Out-Null
    }

    $r.AppendChild($clone) | Out-Null
  }

  $edges = @($cells | Where-Object { $_.edge -eq '1' -and $_.parent -eq '1' })
  foreach ($e in $edges) {
    $sid = [string]$e.source
    $tid = [string]$e.target

    if ($includeIds.Contains($sid) -and $includeIds.Contains($tid)) {
      $ec = $newDoc.CreateElement('mxCell')
      foreach ($a in $e.Attributes) {
        $ec.SetAttribute($a.Name, $a.Value)
      }

      if ($e.mxGeometry) {
        $eg = $newDoc.CreateElement('mxGeometry')
        foreach ($ga in $e.mxGeometry.Attributes) {
          $eg.SetAttribute($ga.Name, $ga.Value)
        }
        $ec.AppendChild($eg) | Out-Null
      }

      $r.AppendChild($ec) | Out-Null
    }
  }

  $gModel.AppendChild($r) | Out-Null
  $diagram.AppendChild($gModel) | Out-Null
  $mxfile.AppendChild($diagram) | Out-Null
}

$newDoc.Save($outFile)
Write-Output "Created: $outFile"
Write-Output "Total classes: $total"
Write-Output "Parts: $partCount"
Write-Output "Classes per part: $classesPerPart"
