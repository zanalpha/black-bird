$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$mime = @{
  '.html'  = 'text/html; charset=utf-8'
  '.js'    = 'text/javascript; charset=utf-8'
  '.css'   = 'text/css; charset=utf-8'
  '.svg'   = 'image/svg+xml'
  '.woff2' = 'font/woff2'
  '.woff'  = 'font/woff'
  '.png'   = 'image/png'
  '.ico'   = 'image/x-icon'
  '.json'  = 'application/json'
  '.txt'   = 'text/plain; charset=utf-8'
}

$listener = $null
$port = 0
foreach ($candidate in 8765..8775) {
  try {
    $tryListener = New-Object System.Net.HttpListener
    $tryListener.Prefixes.Add("http://127.0.0.1:$candidate/")
    $tryListener.Start()
    $listener = $tryListener
    $port = $candidate
    break
  } catch {
    if ($tryListener) { $tryListener.Close() }
  }
}

if (-not $listener) {
  Write-Host 'Tidak bisa membuka Black Bird. Port 8765 sampai 8775 sedang dipakai.'
  exit 1
}

Write-Host "Black Bird berjalan di http://127.0.0.1:$port/"
Write-Host 'Biarkan jendela ini terbuka. Tutup jendela ini untuk berhenti.'
Start-Process "http://127.0.0.1:$port/"

while ($listener.IsListening) {
  $context = $listener.GetContext()
  try {
    $relative = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart('/'))
    if ([string]::IsNullOrWhiteSpace($relative)) { $relative = 'index.html' }
    $relative = $relative.Replace('/', [IO.Path]::DirectorySeparatorChar)
    $file = [IO.Path]::GetFullPath((Join-Path $root $relative))
    $rootFull = [IO.Path]::GetFullPath($root)
    if (-not $file.StartsWith($rootFull, [StringComparison]::OrdinalIgnoreCase)) {
      $context.Response.StatusCode = 403
    } elseif (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
      $context.Response.StatusCode = 404
      $missing = [Text.Encoding]::UTF8.GetBytes('Tidak ditemukan')
      $context.Response.ContentType = 'text/plain; charset=utf-8'
      $context.Response.OutputStream.Write($missing, 0, $missing.Length)
    } else {
      $extension = [IO.Path]::GetExtension($file).ToLowerInvariant()
      $contentType = $mime[$extension]
      if (-not $contentType) { $contentType = 'application/octet-stream' }
      $data = [IO.File]::ReadAllBytes($file)
      $context.Response.ContentType = $contentType
      $context.Response.ContentLength64 = $data.LongLength
      $context.Response.OutputStream.Write($data, 0, $data.Length)
    }
  } finally {
    $context.Response.Close()
  }
}
