$ErrorActionPreference = 'Stop'

$inFile = 'c:\Users\Nisarg Bhavsar\ueorms-saas\ERP-SYSTEM-PROJECT\report\diagrams\UEORMS_FULL_CLASS_DIAGRAM.final.drawio'
$outFile = 'c:\Users\Nisarg Bhavsar\ueorms-saas\ERP-SYSTEM-PROJECT\report\diagrams\UEORMS_MODULE_WISE_CLASS_DIAGRAM.drawio'

[xml]$doc = Get-Content -Path $inFile -Raw
$root = $doc.mxfile.diagram.mxGraphModel.root
$cells = @($root.mxCell)

$modules = @()
foreach ($cid in 3..15) {
  $c = $cells | Where-Object { $_.id -eq [string]$cid } | Select-Object -First 1
  if ($null -ne $c) {
    $geo = $c.mxGeometry
    $modules += [pscustomobject]@{
      Id = [string]$cid
      Name = [string]$c.value
      X = [double]$geo.x
      Y = [double]$geo.y
      W = [double]$geo.width
      H = [double]$geo.height
    }
  }
}

$byId = @{}
foreach ($c in $cells) { $byId[[string]$c.id] = $c }

$excludedTop = @('2') + ($modules | ForEach-Object { $_.Id })
$topClasses = @(
  $cells | Where-Object {
    $_.vertex -eq '1' -and $_.parent -eq '1' -and ($excludedTop -notcontains [string]$_.id)
  }
)

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

$moduleToClassTopIds = @{}
foreach ($m in $modules) {
  $moduleToClassTopIds[$m.Id] = New-Object System.Collections.Generic.List[string]
}

foreach ($cls in $topClasses) {
  $g = $cls.mxGeometry
  if ($null -eq $g) { continue }

  $x = [double]$g.x
  $y = [double]$g.y

  foreach ($m in $modules) {
    if ($x -ge $m.X -and $x -le ($m.X + $m.W) -and $y -ge $m.Y -and $y -le ($m.Y + $m.H)) {
      $moduleToClassTopIds[$m.Id].Add([string]$cls.id)
      break
    }
  }
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

$pageIndex = 1
foreach ($m in $modules) {
  $d = $newDoc.CreateElement('diagram')
  $safeName = [string]$m.Name
  $d.SetAttribute('id', ('MOD-' + $m.Id))
  $d.SetAttribute('name', ('{0:00}. {1}' -f $pageIndex, $safeName))
  $pageIndex++

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
  $title.SetAttribute('value', ('Module: ' + $safeName))
  $title.SetAttribute('style', 'rounded=0;whiteSpace=wrap;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;spacingTop=6;spacingLeft=8;fontSize=16;fontStyle=1;')
  $title.SetAttribute('vertex', '1')
  $title.SetAttribute('parent', '1')
  $tg = $newDoc.CreateElement('mxGeometry')
  $tg.SetAttribute('x', '20')
  $tg.SetAttribute('y', '20')
  $tg.SetAttribute('width', '1200')
  $tg.SetAttribute('height', '40')
  $tg.SetAttribute('as', 'geometry')
  $title.AppendChild($tg) | Out-Null
  $r.AppendChild($title) | Out-Null

  $includeIds = New-Object System.Collections.Generic.HashSet[string]
  foreach ($topId in $moduleToClassTopIds[$m.Id]) {
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
        $nx = [math]::Round($ox - $m.X + 40, 2)
        $ny = [math]::Round($oy - $m.Y + 90, 2)
        $geom.SetAttribute('x', [string]$nx)
        $geom.SetAttribute('y', [string]$ny)
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
  $d.AppendChild($gModel) | Out-Null
  $mxfile.AppendChild($d) | Out-Null
}

$newDoc.Save($outFile)
Write-Output "Created: $outFile"
Write-Output "Pages: $($modules.Count)"
