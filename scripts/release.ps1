# PowerShell Release Script for Eureka Mobile
# Usage:
#   $env:GITHUB_TOKEN = "ghp_yourTokenHere"
#   .\scripts\release.ps1 -Version "1.0.1" -ApkUrl "https://expo.dev/artifacts/eas/xxxx.apk"
#   .\scripts\release.ps1 -Version "1.0.1" -ApkUrl "https://..." -Notes "Bug fixes and improvements"

param(
    [Parameter(Mandatory=$true)]
    [string]$Version,

    [Parameter(Mandatory=$true)]
    [string]$ApkUrl,

    [string]$Notes = "Bug fixes, performance improvements, and UI enhancements.",

    [switch]$Prerelease
)

$ErrorActionPreference = "Stop"

$GITHUB_TOKEN = $env:GITHUB_TOKEN
$REPO = "TECHTUNE-I-T-SOLUTIONS/eurekamobile"
$TAG = "v$Version"
$APK_FILENAME = "eureka-$TAG.apk"

if (-not $GITHUB_TOKEN) {
    Write-Error "GITHUB_TOKEN environment variable is not set. Get a token at https://github.com/settings/tokens with 'repo' scope."
    exit 1
}

$HEADERS = @{
    "Authorization" = "token $GITHUB_TOKEN"
    "Accept"        = "application/vnd.github.v3+json"
    "User-Agent"    = "EurekaReleaseScript/1.0"
}

Write-Host "📱 Eureka Mobile Release Script" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "  Version : $TAG" -ForegroundColor White
Write-Host "  Repo    : $REPO" -ForegroundColor White
Write-Host ""

# Step 1: Download APK
$TempApk = Join-Path $env:TEMP $APK_FILENAME
Write-Host "⬇️  Downloading APK from EAS..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $ApkUrl -OutFile $TempApk -UseBasicParsing
    $ApkSize = (Get-Item $TempApk).Length
    Write-Host "    ✅ Downloaded: $([math]::Round($ApkSize / 1MB, 1)) MB" -ForegroundColor Green
} catch {
    Write-Error "Failed to download APK: $_"
    exit 1
}

# Step 2: Create GitHub Release
Write-Host "🏷️  Creating GitHub release $TAG..." -ForegroundColor Yellow
$ReleaseBody = @{
    tag_name         = $TAG
    target_commitish = "main"
    name             = "Eureka $TAG"
    body             = "## Eureka $TAG`n`n$Notes`n`n### Installation`n1. Download the APK below`n2. Enable 'Install from Unknown Sources' on your Android device`n3. Open the downloaded APK to install"
    draft            = $false
    prerelease       = $Prerelease.IsPresent
} | ConvertTo-Json -Depth 5

try {
    $CreateResponse = Invoke-RestMethod `
        -Uri "https://api.github.com/repos/$REPO/releases" `
        -Method POST `
        -Headers $HEADERS `
        -Body $ReleaseBody `
        -ContentType "application/json"
    $ReleaseId = $CreateResponse.id
    $ReleaseUrl = $CreateResponse.html_url
    Write-Host "    ✅ Release created: $ReleaseUrl" -ForegroundColor Green
} catch {
    Write-Error "Failed to create release: $_"
    Remove-Item $TempApk -ErrorAction SilentlyContinue
    exit 1
}

# Step 3: Upload APK asset
Write-Host "📤 Uploading APK to release..." -ForegroundColor Yellow
$UploadUrl = "https://uploads.github.com/repos/$REPO/releases/$ReleaseId/assets?name=$APK_FILENAME"

try {
    $UploadResponse = Invoke-RestMethod `
        -Uri $UploadUrl `
        -Method POST `
        -Headers ($HEADERS + @{ "Content-Type" = "application/vnd.android.package-archive" }) `
        -InFile $TempApk
    Write-Host "    ✅ APK uploaded: $($UploadResponse.browser_download_url)" -ForegroundColor Green
} catch {
    Write-Error "Failed to upload APK: $_"
    exit 1
} finally {
    Remove-Item $TempApk -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "🎉 Release complete!" -ForegroundColor Green
Write-Host "   GitHub Release : $ReleaseUrl" -ForegroundColor Cyan
Write-Host "   Download Page  : http://eureka.vercel.app/app" -ForegroundColor Cyan
Write-Host ""
