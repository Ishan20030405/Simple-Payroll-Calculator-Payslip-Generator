param([switch]$NoBrowser)
$ErrorActionPreference='Stop'
$releaseRoot=$PSScriptRoot
$runtimeDir=Join-Path $releaseRoot '.runtime'
$pidFile=Join-Path $runtimeDir 'processes.json'
$started=@()
try {
 $nodeExe=(Get-Command node.exe -ErrorAction Stop).Source
 $existing=@()
 foreach($service in @(@{name='backend';entry='start-local.cjs';port=5000},@{name='frontend';entry='serve-local.cjs';port=3000})) {
  $entry=Join-Path (Join-Path $releaseRoot $service.name) $service.entry
  $listener=Get-NetTCPConnection -LocalPort $service.port -State Listen -ErrorAction SilentlyContinue
  foreach($owner in @($listener.OwningProcess | Select-Object -Unique)) {
   if(-not $owner){continue}
   $process=Get-CimInstance Win32_Process -Filter ('ProcessId = '+[int]$owner) -ErrorAction SilentlyContinue
   if($process -and $process.CommandLine -and $process.CommandLine.IndexOf($entry,[StringComparison]::OrdinalIgnoreCase) -ge 0){
    $existing+=@{name=$service.name;id=[int]$owner;entry=$entry}
   }
  }
 }
 if($existing.Count -eq 2){
  & $nodeExe (Join-Path $releaseRoot 'check-ready.cjs')
  if($LASTEXITCODE -eq 0){
   New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
   $existing | ConvertTo-Json | Set-Content -LiteralPath $pidFile -Encoding UTF8
   Write-Output 'Already running: http://localhost:3000'
   Write-Output 'Double-click stop.bat when finished.'
   if(-not $NoBrowser){Start-Process 'http://localhost:3000'}
   exit 0
  }
 }
 foreach($port in @(3000,5000)) {
  if(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue){throw "Port $port is already in use. Stop its existing server before starting this release."}
 }
 if(-not(Test-Path -LiteralPath (Join-Path $releaseRoot 'backend/.env'))){throw 'Missing backend/.env. Restore the private release configuration.'}
 if(-not(Test-Path -LiteralPath (Join-Path $releaseRoot 'backend/node_modules/mysql2'))){
  Push-Location (Join-Path $releaseRoot 'backend')
  try { & npm.cmd ci --omit=dev; if($LASTEXITCODE -ne 0){throw 'Backend dependency installation failed.'} } finally {Pop-Location}
 }
 New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
 foreach($service in @(@{name='backend';entry='start-local.cjs'},@{name='frontend';entry='serve-local.cjs'})) {
  $working=Join-Path $releaseRoot $service.name
  $entry=Join-Path $working $service.entry
  $p=Start-Process -FilePath $nodeExe -ArgumentList ('"'+$entry+'"') -WorkingDirectory $working -WindowStyle Normal -PassThru
  $started+=@{name=$service.name;id=$p.Id;entry=$entry}
 }
 $started | ConvertTo-Json | Set-Content -LiteralPath $pidFile -Encoding UTF8
 $ready=$false
 for($attempt=0;$attempt -lt 40;$attempt++) {
  foreach($p in $started){if(-not(Get-Process -Id $p.id -ErrorAction SilentlyContinue)){throw ($p.name+' exited. Check its log in the .runtime folder.')}}
  & $nodeExe (Join-Path $releaseRoot 'check-ready.cjs')
  if($LASTEXITCODE -eq 0){$ready=$true;break}
  Start-Sleep -Milliseconds 500
 }
 if(-not $ready){throw 'Startup did not finish. Check the logs in .runtime.'}
 Write-Output 'Ready: http://localhost:3000'
 Write-Output 'API: http://localhost:5000/api'
 Write-Output 'Using the existing cloud database. Double-click stop.bat to stop this release.'
 if(-not $NoBrowser){Start-Process 'http://localhost:3000'}
} catch {
 foreach($p in $started){Stop-Process -Id $p.id -ErrorAction SilentlyContinue}
 if($started.Count -gt 0 -and (Test-Path -LiteralPath $pidFile)){Remove-Item -LiteralPath $pidFile}
 Write-Error $_
 exit 1
}



