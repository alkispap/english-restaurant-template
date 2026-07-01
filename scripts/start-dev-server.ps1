$ErrorActionPreference = "Stop"

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Ports = @(3000, 3001)
$TargetPort = 3000
$HostName = "127.0.0.1"
$Url = "http://${HostName}:${TargetPort}/"
$HealthUrl = "http://${HostName}:${TargetPort}/robots.txt"
$NextDir = Join-Path $ProjectRoot ".next"
$OutLog = Join-Path $NextDir "dev-server.out.log"
$ErrLog = Join-Path $NextDir "dev-server.err.log"

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

  foreach ($port in $Ports) {
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

  foreach ($port in $Ports) {
    $connections = @(Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue)
    foreach ($connection in $connections) {
      $owner = Get-CimInstance Win32_Process -Filter "ProcessId = $($connection.OwningProcess)" -ErrorAction SilentlyContinue
      if ($owner -and $owner.CommandLine -and -not $owner.CommandLine.Contains($ProjectRoot)) {
        Write-Warning "Port $port is used by another process ($($connection.OwningProcess)); leaving it alone."
      }
    }
  }
}

function Wait-ForServer {
  param(
    [string] $HealthUrl,
    [int] $TimeoutSeconds = 90
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri $HealthUrl -TimeoutSec 5
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return $true
      }
    } catch {
      Start-Sleep -Seconds 2
    }
  } while ((Get-Date) -lt $deadline)

  return $false
}

Set-Location $ProjectRoot
New-Item -ItemType Directory -Force -Path $NextDir | Out-Null

Stop-ProjectDevServers

Write-Host "Starting Next dev server at $Url"
$process = Start-Process -FilePath "npm.cmd" `
  -ArgumentList @("run", "dev:next") `
  -WorkingDirectory $ProjectRoot `
  -RedirectStandardOutput $OutLog `
  -RedirectStandardError $ErrLog `
  -WindowStyle Hidden `
  -PassThru

if (Wait-ForServer -HealthUrl $HealthUrl) {
  Write-Host "Dev server is ready: $Url"
  Write-Host "Logs: $OutLog"
  exit 0
}

Write-Error "Dev server did not respond within the timeout. Check $ErrLog"
if (Test-Path $ErrLog) {
  Get-Content -LiteralPath $ErrLog -Tail 40
}
Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
Stop-ProjectDevServers
exit 1
