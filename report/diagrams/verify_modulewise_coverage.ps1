[xml]$src = Get-Content -Raw '.\report\diagrams\UEORMS_FULL_CLASS_DIAGRAM.final.drawio'
[xml]$gen = Get-Content -Raw '.\report\diagrams\UEORMS_MODULE_WISE_CLASS_DIAGRAM.drawio'

$srcCells = @($src.mxfile.diagram.mxGraphModel.root.mxCell)
$modIds = 3..15 | ForEach-Object { [string]$_ }
$srcTop = @(
  $srcCells | Where-Object {
    $_.vertex -eq '1' -and $_.parent -eq '1' -and $_.id -notin (@('2') + $modIds)
  }
)
$srcIds = $srcTop | ForEach-Object { [string]$_.id } | Sort-Object -Unique

$genIds = @()
foreach ($d in @($gen.mxfile.diagram)) {
  $cells = @($d.mxGraphModel.root.mxCell)
  $ids = $cells |
    Where-Object { $_.vertex -eq '1' -and $_.parent -eq '1' -and $_.id -ne 'title' } |
    ForEach-Object { [string]$_.id }
  $genIds += $ids
}
$genIds = $genIds | Sort-Object -Unique

$missing = $srcIds | Where-Object { $_ -notin $genIds }
$extra = $genIds | Where-Object { $_ -notin $srcIds }

Write-Output "Source top-level classes: $($srcIds.Count)"
Write-Output "Generated unique top-level classes: $($genIds.Count)"
Write-Output "Missing count: $($missing.Count)"
if ($missing.Count -gt 0) {
  Write-Output ("Missing IDs: " + ($missing -join ', '))
}
Write-Output "Extra count: $($extra.Count)"
if ($extra.Count -gt 0) {
  Write-Output ("Extra IDs: " + ($extra -join ', '))
}
