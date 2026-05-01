$ErrorActionPreference = 'Stop'

$inputFile = '.\report\diagrams\UEORMS_MODULE_WISE_CLASS_DIAGRAM.drawio'
$outputFile = '.\report\diagrams\UEORMS_MODULE_WISE_CLASS_DIAGRAM_SMALL.drawio'

# Scale factors for a compact, readable layout
$positionScale = 0.72
$sizeScale = 0.72

[xml]$doc = Get-Content -Path $inputFile -Raw

foreach ($diagram in @($doc.mxfile.diagram)) {
  $model = $diagram.mxGraphModel

  if ($model.pageWidth) {
    $newW = [math]::Max(1200, [int]([double]$model.pageWidth * 0.78))
    $model.pageWidth = [string]$newW
  }
  if ($model.pageHeight) {
    $newH = [math]::Max(900, [int]([double]$model.pageHeight * 0.78))
    $model.pageHeight = [string]$newH
  }

  $cells = @($model.root.mxCell)
  foreach ($cell in $cells) {
    if ($null -eq $cell.mxGeometry) { continue }

    $g = $cell.mxGeometry

    # Scale only class/title vertices; child rows in swimlanes keep relative sizing
    if ($cell.vertex -eq '1' -and ($cell.parent -eq '1' -or $cell.id -eq 'title')) {
      if ($g.x -ne $null -and $g.x -ne '') {
        $g.x = [string][math]::Round(([double]$g.x) * $positionScale, 2)
      }
      if ($g.y -ne $null -and $g.y -ne '') {
        $g.y = [string][math]::Round(([double]$g.y) * $positionScale, 2)
      }
      if ($g.width -ne $null -and $g.width -ne '') {
        $g.width = [string][math]::Round(([double]$g.width) * $sizeScale, 2)
      }
      if ($g.height -ne $null -and $g.height -ne '') {
        $g.height = [string][math]::Round(([double]$g.height) * $sizeScale, 2)
      }

      # Make text slightly denser for compact pages
      if ($cell.style) {
        $style = [string]$cell.style
        if ($style -match 'fontSize=') {
          $style = [regex]::Replace($style, 'fontSize=([0-9]+)', {
            param($m)
            $orig = [int]$m.Groups[1].Value
            $scaled = [math]::Max(7, [int][math]::Round($orig * 0.9))
            return "fontSize=$scaled"
          })
        }
        $cell.style = $style
      }
    }
  }
}

$doc.Save($outputFile)
Write-Output "Created: $outputFile"
