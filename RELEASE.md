# Eureka Mobile — Release Guide

## Overview

When you have a production APK URL (from EAS Build), use the scripts in this directory to publish a GitHub Release. The download page at **http://eureka.vercel.app/app** fetches the latest release automatically and presents a one-click download button.

---

## Prerequisites

1. **GitHub Personal Access Token** with `repo` scope
   - Generate at: https://github.com/settings/tokens
   - Needs: `Contents: Read & Write` (for creating releases and uploading assets)

2. **EAS Build APK URL** — After a successful `eas build`, copy the `.apk` download URL from:
   - [EAS Build Dashboard](https://expo.dev) → your project → latest build → "Download"

---

## How to Build with EAS

```bash
# Install EAS CLI globally if needed
npm install -g eas-cli

# Login
eas login

# Build production Android APK
eas build --platform android --profile production
```

Wait for the build to complete (typically 10–15 minutes). Copy the APK download URL from the Expo dashboard.

---

## Publishing a Release

### Windows (PowerShell)

```powershell
# Set your token
$env:GITHUB_TOKEN = "ghp_xxxxxxxxxxxxxxxxxxxx"

# Publish
.\scripts\release.ps1 `
  -Version "1.0.2" `
  -ApkUrl "https://expo.dev/artifacts/eas/xxxx.apk" `
  -Notes "Fixed keyboard positioning in chat, improved home screen loading"
```

### macOS / Linux / CI (Bash)

```bash
# Requires: curl, jq
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"

chmod +x ./scripts/release.sh

./scripts/release.sh \
  --version "1.0.2" \
  --apk-url "https://expo.dev/artifacts/eas/xxxx.apk" \
  --notes "Fixed keyboard positioning in chat, improved home screen loading"
```

### Optional Flags

| Flag | Description |
|------|-------------|
| `--prerelease` / `-Prerelease` | Mark release as a pre-release/beta |
| `--notes` / `-Notes` | Custom release notes (shown on GitHub and download page) |

---

## How the Download Page Works

```
User visits http://eureka.vercel.app/app
          ↓
  GET /api/app/releases
          ↓
  GitHub API: GET /repos/TECHTUNE-I-T-SOLUTIONS/eurekamobile/releases
          ↓
  Finds latest stable release with .apk asset
          ↓
  Shows version, release date, size, download count
  "Download APK" button → links directly to GitHub release asset
```

The page at `/app` is at [`app/app/page.tsx`](app/app/page.tsx) in the web project at `D:\Codes\eureka`.

The API routes are at:
- [`app/api/app/releases/route.ts`](../eureka/app/api/app/releases/route.ts) — lists all releases
- [`app/api/app/download/route.ts`](../eureka/app/api/app/download/route.ts) — redirects to latest APK

---

## Versioning Convention

| Version Format | Meaning |
|---------------|---------|
| `1.0.1` | Current stable |
| `1.0.2` | Minor patch |
| `1.1.0` | Feature update |
| `1.0.2-beta` | Beta (use `--prerelease`) |

Always match the version in `package.json` before publishing.
