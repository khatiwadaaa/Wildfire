param([string]$BaseUrl = 'http://localhost:8000')
$ErrorActionPreference = 'Stop'
$pass = 0; $fail = 0
function Test-Step([string]$Name, [scriptblock]$Action) {
  try { & $Action; Write-Host "PASS: $Name" -ForegroundColor Green; $script:pass++ }
  catch { Write-Host "FAIL: $Name - $($_.Exception.Message)" -ForegroundColor Red; $script:fail++ }
}
function Post-Json([string]$Path, $Body) {
  Invoke-RestMethod -Method Post -Uri "$BaseUrl$Path" -ContentType 'application/json' -Body ($Body | ConvertTo-Json -Depth 12) -TimeoutSec 90
}
Write-Host "TrojanScout backend smoke test: $BaseUrl"
$players = @()
Test-Step 'Player API reachable' {
  $response = Invoke-RestMethod -Uri "$BaseUrl/players" -TimeoutSec 15
  if ($response -is [System.Array]) {
    $script:players = @($response)
  } elseif ($null -ne $response.players) {
    $script:players = @($response.players)
  } elseif ($null -ne $response.items) {
    $script:players = @($response.items)
  } elseif ($null -ne $response.data) {
    $script:players = @($response.data)
  } else {
    $script:players = @($response)
  }
  if ($players.Count -eq 0) { throw 'Player database empty' }
  Write-Host "  Players: $($players.Count)"
}
if ($players.Count -eq 0) { Write-Host 'Add players before running recruiting tests.'; exit 1 }
$grad = @($players | Where-Object category -eq 'graduating')
$current = @($players | Where-Object category -eq 'current')
$recruits = @($players | Where-Object category -eq 'recruit')
Write-Host "  Categories: graduating=$($grad.Count), current=$($current.Count), recruit=$($recruits.Count)"
if ($grad.Count -lt 1 -or $current.Count -lt 1 -or $recruits.Count -lt 1) {
  Write-Host 'BLOCKED: roster requires at least one graduating, current, and recruit player. Add those categories in the Players page.' -ForegroundColor Yellow
  exit 2
}
$g = [int]$grad[0].id
$c = [int]$current[0].id
$r = [int]$recruits[0].id
$payload = @{graduating_player_ids=@($g);returning_player_ids=@($c);recruit_ids=@($r);max_recruits=1}
Test-Step 'Roster analysis' {
  $res = Post-Json '/roster/analyze' @{graduating_player_ids=@($g);returning_player_ids=@($c)}
  if ($null -eq $res) { throw 'Empty roster analysis' }
}
Test-Step 'Roster simulation and optimization' {
  $res = Post-Json '/roster/simulate' $payload
  if ($null -eq $res.optimization) { throw 'Optimization field missing' }
}
Test-Step 'Recruit comparison' {
  $res = Post-Json '/comparisons' @{target_player_id=$g;recruit_ids=@($r)}
  if ($null -eq $res.ranked_recruits) { throw 'ranked_recruits field missing' }
}
Test-Step 'Scouting report generation' {
  $res = Post-Json '/roster/report' $payload
  if ($null -eq $res) { throw 'Empty report response' }
}
Write-Host "`nResult: $pass passed, $fail failed."
if ($fail -gt 0) { exit 1 }
