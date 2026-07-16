$ErrorActionPreference = "Stop"

$teamId = "team_f7ZDi8IQ0mmPXO3BE0oQzuKy"
$project = "beef"
$envFile = Join-Path $PSScriptRoot ".." ".env" | Resolve-Path

function Get-DotEnvValue([string]$Name) {
  foreach ($line in Get-Content $envFile) {
    if ($line -match "^\s*$Name\s*=\s*(.+)\s*$") {
      return $Matches[1].Trim()
    }
  }
  throw "Missing $Name in $envFile"
}

$vars = [ordered]@{
  "NEXT_PUBLIC_CONVEX_URL" = "https://sincere-coyote-700.convex.cloud"
  "NEXT_PUBLIC_CONVEX_SITE_URL" = "https://sincere-coyote-700.convex.site"
  "CONVEX_DEPLOYMENT" = "dev:sincere-coyote-700"
  "OPENAI_MODEL_ID" = "gpt-4.1-nano"
  "OPENAI_API_KEY" = Get-DotEnvValue "OPENAI_API_KEY"
  "REPORT_EMAIL_PASS" = Get-DotEnvValue "REPORT_EMAIL_PASS"
  "REPORT_EMAIL_USER" = "barsbuildme@gmail.com"
}

$results = @()
foreach ($entry in $vars.GetEnumerator()) {
  $body = @{
    key = $entry.Key
    value = $entry.Value
    type = "plain"
    target = @("production", "preview")
  } | ConvertTo-Json -Compress

  $endpoint = "/v10/projects/$project/env?upsert=true&teamId=$teamId"
  try {
    $output = npx --yes vercel@latest api $endpoint -X POST --body $body 2>&1 | Out-String
    $results += [pscustomobject]@{
      key = $entry.Key
      status = if ($LASTEXITCODE -eq 0) { "ok" } else { "error" }
      detail = $output.Trim()
    }
  } catch {
    $results += [pscustomobject]@{
      key = $entry.Key
      status = "error"
      detail = $_.Exception.Message
    }
  }
}

Write-Output "ENV_RESULTS_START"
$results | ConvertTo-Json -Depth 4
Write-Output "ENV_RESULTS_END"

try {
  $deployOutput = npx --yes vercel@latest api "/v13/deployments" -X POST --body (@{
    name = $project
    project = $project
    target = "production"
  } | ConvertTo-Json -Compress) --scope noambars-projects 2>&1 | Out-String
  Write-Output "DEPLOY_RESULT_START"
  Write-Output $deployOutput.Trim()
  Write-Output "DEPLOY_RESULT_END"
} catch {
  Write-Output "DEPLOY_RESULT_START"
  Write-Output $_.Exception.Message
  Write-Output "DEPLOY_RESULT_END"
}
