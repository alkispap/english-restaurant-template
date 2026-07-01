$ErrorActionPreference = "Stop"

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$WatchedPorts = @(3000, 3001)
$OutDir = Join-Path $ProjectRoot "out"
$env:NEXT_PUBLIC_SITE_URL = "https://indianrestaurantlondon.co.uk"
$env:NEXT_STATIC_EXPORT = "1"

function Get-ProjectNodeProcesses {
  Get-CimInstance Win32_Process -Filter "name = 'node.exe'" |
    Where-Object {
      $_.CommandLine -and
      $_.CommandLine.Contains($ProjectRoot) -and
      ($_.CommandLine -match "next|npm-cli\.js")
    }
}

function Stop-ProjectDevServers {
  $projectProcesses = @(Get-ProjectNodeProcesses)
  $portOwners = @{}

  foreach ($port in $WatchedPorts) {
    $connections = @(Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue)
    foreach ($connection in $connections) {
      $portOwners[[int]$connection.OwningProcess] = $port
    }
  }

  foreach ($process in $projectProcesses) {
    $ownsWatchedPort = $portOwners.ContainsKey([int]$process.ProcessId)
    $looksLikeDevServer = $process.CommandLine -match "next(\\|/)?dist|next dev|npm-cli\.js.+run dev"

    if ($ownsWatchedPort -or $looksLikeDevServer) {
      Write-Host "Stopping existing project dev server process $($process.ProcessId)."
      Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
    }
  }
}

function Run-Step {
  param(
    [string] $Label,
    [string[]] $Arguments
  )

  Write-Host ""
  Write-Host "== $Label =="
  $startedAt = Get-Date
  $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
  & npm.cmd @Arguments
  $exitCode = $LASTEXITCODE
  $stopwatch.Stop()

  if ($exitCode -ne 0) {
    throw "$Label failed with exit code $exitCode."
  }

  Write-Host "$Label completed in $([math]::Round($stopwatch.Elapsed.TotalSeconds, 2)) seconds."
  Write-Host "Started: $($startedAt.ToString('yyyy-MM-dd HH:mm:ss'))"
  Write-Host "Finished: $((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))"
}

Set-Location $ProjectRoot

Write-Host "Preparing Cloudflare upload for $ProjectRoot"
Stop-ProjectDevServers

Run-Step "Static export build" @("run", "build:static")
Run-Step "Cloudflare export checks" @("run", "check:cloudflare")

if (-not (Test-Path $OutDir)) {
  throw "Expected upload folder is missing: $OutDir"
}

$fileCount = (Get-ChildItem $OutDir -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
Write-Host ""
Write-Host "Cloudflare upload preparation complete."
Write-Host "Upload-ready folder: $OutDir"
Write-Host "Files ready: $fileCount"
