param(
    [string]$InputDocx = (Join-Path $PSScriptRoot '../output/docx/Cinema_Lab10_Report.docx'),
    [string]$OutputPdf = (Join-Path $PSScriptRoot '../output/pdf/Cinema_Lab10_Report.pdf')
)
$ErrorActionPreference = 'Stop'
$docxPath = [System.IO.Path]::GetFullPath($InputDocx)
$pdfPath = [System.IO.Path]::GetFullPath($OutputPdf)
$wordTask = New-Object -ComObject Word.Application
$wordTask.Visible = $false
$wordTask.DisplayAlerts = 0
try {
    $finalDoc = $wordTask.Documents.Open($docxPath, $false, $true)
    $finalDoc.ExportAsFixedFormat($pdfPath, 17)
    Write-Output ('Exported PDF pages: ' + $finalDoc.ComputeStatistics(2))
    $finalDoc.Close($false)
} finally {
    $wordTask.Quit()
}
