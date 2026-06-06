param(
    [Parameter(Mandatory=$false)]
    [string]$File = "",
    
    [string]$Port = "9222",
    
    [switch]$Preview
)

if (-not $File) {
    # 找当前目录下最新的 .md 文件
    $mdFiles = Get-ChildItem -Filter "*.md" | Sort-Object LastWriteTime -Descending
    if ($mdFiles) {
        $File = $mdFiles[0].FullName
        Write-Host "📄 使用最新文件: $(Split-Path $File -Leaf)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ 请指定 Markdown 文件路径" -ForegroundColor Red
        Write-Host "用法: .\publish.ps1 -File <路径> [-Preview] [-Port <端口>]" -ForegroundColor Gray
        exit 1
    }
}

if (-not (Test-Path $File)) {
    Write-Host "❌ 找不到文件: $File" -ForegroundColor Red
    exit 1
}

$File = (Resolve-Path $File).Path

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  知乎文章自动发布工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "文件: $File"
if ($Preview) {
    Write-Host "模式: 预览（仅填入，不发布）" -ForegroundColor Yellow
} else {
    Write-Host "模式: 自动发布" -ForegroundColor Green
}
Write-Host ""

$env:FILE = $File
$env:PORT = $Port
if ($Preview) { $env:NOPUBLISH = "1" } else { $env:NOPUBLISH = "0" }

node zhihu_publish.js 2>&1

Write-Host ""
Write-Host "提示: 下次只需输入 .\publish.ps1 即可自动发布最新md文件" -ForegroundColor Gray
