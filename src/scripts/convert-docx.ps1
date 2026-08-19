param (
    [string]$docxPath,
    [string]$pdfPath
)

$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    # Ensure paths are absolute
    $absoluteDocxPath = [System.IO.Path]::GetFullPath($docxPath)
    $absolutePdfPath = [System.IO.Path]::GetFullPath($pdfPath)
    
    $doc = $word.Documents.Open($absoluteDocxPath)
    # wdFormatPDF = 17
    $doc.SaveAs($absolutePdfPath, 17)
    $doc.Close()
    Write-Output "Conversion successful: $absolutePdfPath"
} catch {
    Write-Error $_.Exception.Message
} finally {
    $word.Quit()
}
