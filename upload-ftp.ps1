param(
  [Parameter(Mandatory = $true)]
  [string]$HostName,
  [Parameter(Mandatory = $true)]
  [string]$Username,
  [Parameter(Mandatory = $true)]
  [string]$Password
)

$ErrorActionPreference = 'Stop'

$localRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

$includeRoots = @(
  'assets',
  'branches',
  'model',
  'model2',
  'projects',
  'storemore',
  'team',
  'tutorials',
  'versions',
  '404.html',
  'index.html',
  'index.php',
  'publications.html',
  'team.html',
  '.htaccess',
  'h2res_research_outputs.bib',
  'robots.txt',
  'sitemap.xml'
)

$curlPath = (Get-Command 'C:\Windows\System32\curl.exe').Source
if (-not $curlPath) {
  throw 'curl.exe not found.'
}

$items = foreach ($entry in $includeRoots) {
  $fullPath = Join-Path $localRoot $entry
  if (-not (Test-Path -LiteralPath $fullPath)) {
    throw "Missing path: $entry"
  }

  if (Test-Path -LiteralPath $fullPath -PathType Leaf) {
    Get-Item -LiteralPath $fullPath
  } else {
    Get-ChildItem -LiteralPath $fullPath -File -Recurse
  }
}

$items = $items | Sort-Object FullName -Unique
$localRootWithSlash = $localRoot.TrimEnd('\') + '\'

foreach ($item in $items) {
  if (-not $item.FullName.StartsWith($localRootWithSlash, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Path outside local root: $($item.FullName)"
  }

  $relativePath = $item.FullName.Substring($localRootWithSlash.Length).Replace('\', '/')
  $remoteUrl = "ftp://$HostName/$relativePath"

  Write-Host "Uploading $relativePath"
  & $curlPath --silent --show-error --ftp-create-dirs -T $item.FullName -u "${Username}:${Password}" $remoteUrl
  if ($LASTEXITCODE -ne 0) {
    throw "Upload failed for $relativePath"
  }
}

Write-Host "Upload complete: $($items.Count) files"
