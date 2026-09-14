$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$package = Get-Content -LiteralPath (Join-Path $repoRoot 'package.json') -Raw | ConvertFrom-Json
$version = $package.version
$distRoot = Join-Path $repoRoot 'dist'
$expectedPrefix = $repoRoot.TrimEnd('\') + '\'

if (-not $distRoot.StartsWith($expectedPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'Release directory resolved outside the repository.'
}

if (Test-Path -LiteralPath $distRoot) {
    Remove-Item -LiteralPath $distRoot -Recurse -Force
}

$packageName = "Multistreamer-v$version"
$stage = Join-Path $distRoot $packageName
New-Item -ItemType Directory -Force -Path $stage | Out-Null

$files = @(
    'index.html',
    'icon.png',
    'manifest.webmanifest',
    'sw.js',
    'stream-sources.js',
    'README.md',
    'CHANGELOG.md',
    'LICENSE'
)

$directories = @(
    'vendor',
    'assets\brand',
    'assets\icons',
    'assets\marketing',
    'assets\screenshots'
)

foreach ($file in $files) {
    Copy-Item -LiteralPath (Join-Path $repoRoot $file) -Destination (Join-Path $stage $file)
}

foreach ($directory in $directories) {
    $destination = Join-Path $stage $directory
    New-Item -ItemType Directory -Force -Path $destination | Out-Null
    Copy-Item -Path (Join-Path $repoRoot $directory '*') -Destination $destination -Recurse -Force
}

$relayDestination = Join-Path $stage 'relay'
New-Item -ItemType Directory -Force -Path $relayDestination | Out-Null
foreach ($relayFile in @('server.js', 'package.json', 'package-lock.json', 'Dockerfile', 'docker-compose.yml')) {
    Copy-Item -LiteralPath (Join-Path $repoRoot "relay\$relayFile") -Destination (Join-Path $relayDestination $relayFile)
}

$archivePath = Join-Path $distRoot "$packageName.zip"
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $archivePath -CompressionLevel Optimal
$archiveHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
$checksumPath = "$archivePath.sha256"
"$archiveHash  $packageName.zip" | Set-Content -LiteralPath $checksumPath -Encoding ascii

Write-Output $archivePath
Write-Output $archiveHash
