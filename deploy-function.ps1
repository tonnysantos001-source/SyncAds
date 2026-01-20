# Supabase Edge Function Deployment Script
# Bypasses CLI by using Management API directly

param(
    [Parameter(Mandatory=$true)]
    [string]$FunctionName = "chat-stream",
    
    [Parameter(Mandatory=$true)]
    [string]$ProjectRef = "ovskepqggmxlfckxqgbr"
)

Write-Host "🚀 Deploying $FunctionName to project $ProjectRef..." -ForegroundColor Cyan

# Get access token from Supabase CLI
Write-Host "📝 Getting access token..." -ForegroundColor Yellow
$tokenOutput = supabase functions deploy --help 2>&1
$accessToken = $env:SUPABASE_ACCESS_TOKEN

if (-not $accessToken) {
    # Try to get from CLI config
    $configPath = "$env:USERPROFILE\.supabase\access-token"
    if (Test-Path $configPath) {
        $accessToken = Get-Content $configPath -Raw
        $accessToken = $accessToken.Trim()
    }
}

if (-not $accessToken) {
    Write-Host "❌ Could not find Supabase access token" -ForegroundColor Red
    Write-Host "Please run: supabase login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Access token found" -ForegroundColor Green

# Read function files
$functionDir = "supabase\functions\$FunctionName"
$indexPath = "$functionDir\index.ts"

if (-not (Test-Path $indexPath)) {
    Write-Host "❌ Function file not found: $indexPath" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Reading function files..." -ForegroundColor Yellow
$indexContent = Get-Content $indexPath -Raw

# Get all TypeScript files in the function directory
$tsFiles = Get-ChildItem -Path $functionDir -Filter "*.ts" -Recurse | Where-Object { $_.Name -ne "index.ts" }

# Create files array for API
$files = @(
    @{
        name = "index.ts"
        content = $indexContent
    }
)

foreach ($file in $tsFiles) {
    $relativePath = $file.FullName.Replace("$PWD\$functionDir\", "").Replace("\", "/")
    $content = Get-Content $file.FullName -Raw
    $files += @{
        name = $relativePath
        content = $content
    }
    Write-Host "  ✓ Added: $relativePath" -ForegroundColor Gray
}

Write-Host "✅ Found $($files.Count) files" -ForegroundColor Green

# Prepare API request
$apiUrl = "https://api.supabase.com/v1/projects/$ProjectRef/functions/$FunctionName"
$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

$body = @{
    slug = $FunctionName
    name = $FunctionName
    verify_jwt = $true
    import_map = $false
    entrypoint_path = "index.ts"
} | ConvertTo-Json -Depth 10

Write-Host "🌐 Deploying to Supabase Management API..." -ForegroundColor Cyan

try {
    # Check if function exists
    $checkResponse = Invoke-RestMethod -Uri $apiUrl -Method Get -Headers $headers -ErrorAction SilentlyContinue
    
    if ($checkResponse) {
        Write-Host "  ℹ️  Function exists, updating..." -ForegroundColor Yellow
        $method = "PATCH"
    } else {
        Write-Host "  ℹ️  Creating new function..." -ForegroundColor Yellow
        $method = "POST"
        $apiUrl = "https://api.supabase.com/v1/projects/$ProjectRef/functions"
    }
} catch {
    Write-Host "  ℹ️  Creating new function..." -ForegroundColor Yellow
    $method = "POST"
    $apiUrl = "https://api.supabase.com/v1/projects/$ProjectRef/functions"
}

# Note: The Supabase Management API doesn't support direct file upload via REST
# We need to use the CLI with Docker, or deploy via GitHub integration

Write-Host "" -ForegroundColor Yellow
Write-Host "⚠️  LIMITATION DETECTED" -ForegroundColor Yellow
Write-Host "The Supabase Management API doesn't support direct Edge Function code deployment." -ForegroundColor Yellow
Write-Host "Deployment requires one of:" -ForegroundColor Yellow
Write-Host "  1. Supabase CLI with Docker running" -ForegroundColor White
Write-Host "  2. GitHub integration (auto-deploy on push)" -ForegroundColor White
Write-Host "  3. Manual deployment via Supabase Dashboard" -ForegroundColor White
Write-Host ""

Write-Host "📋 Quick Fix Options:" -ForegroundColor Cyan
Write-Host "  A) Start Docker Desktop and run:" -ForegroundColor White
Write-Host "     supabase functions deploy $FunctionName --project-ref $ProjectRef" -ForegroundColor Green
Write-Host ""
Write-Host "  B) Deploy via Dashboard:" -ForegroundColor White
Write-Host "     https://supabase.com/dashboard/project/$ProjectRef/functions/$FunctionName/details" -ForegroundColor Blue
Write-Host ""
Write-Host "  C) Setup GitHub Auto-Deploy:" -ForegroundColor White
Write-Host "     https://supabase.com/dashboard/project/$ProjectRef/settings/functions" -ForegroundColor Blue
