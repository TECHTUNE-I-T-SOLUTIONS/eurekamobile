#!/usr/bin/env bash
# Eureka Mobile – GitHub Release Script
#
# Usage:
#   export GITHUB_TOKEN="ghp_yourTokenHere"
#   ./scripts/release.sh --version 1.0.1 --apk-url "https://expo.dev/artifacts/eas/xxxx.apk"
#   ./scripts/release.sh --version 1.0.1 --apk-url "https://..." --notes "Bug fixes"
#
# Requirements: curl, jq (install: brew install jq  /  apt install jq)

set -euo pipefail

REPO="TECHTUNE-I-T-SOLUTIONS/eurekamobile"
VERSION=""
APK_URL=""
NOTES="Bug fixes, performance improvements, and UI enhancements."
PRERELEASE="false"

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --version)  VERSION="$2"; shift 2 ;;
    --apk-url)  APK_URL="$2"; shift 2 ;;
    --notes)    NOTES="$2"; shift 2 ;;
    --prerelease) PRERELEASE="true"; shift ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

if [[ -z "$VERSION" || -z "$APK_URL" ]]; then
  echo "Usage: $0 --version <version> --apk-url <url> [--notes <notes>] [--prerelease]"
  exit 1
fi

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "❌  GITHUB_TOKEN is not set. Get one at https://github.com/settings/tokens with 'repo' scope."
  exit 1
fi

TAG="v${VERSION}"
APK_FILENAME="eureka-${TAG}.apk"
TEMP_APK="/tmp/${APK_FILENAME}"

API="https://api.github.com/repos/${REPO}"
AUTH_HEADER="Authorization: token ${GITHUB_TOKEN}"

echo "📱  Eureka Mobile Release Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Version : ${TAG}"
echo "  Repo    : ${REPO}"
echo ""

# Step 1: Download APK
echo "⬇️   Downloading APK from EAS..."
curl -L --progress-bar -o "${TEMP_APK}" "${APK_URL}"
SIZE=$(du -sh "${TEMP_APK}" | cut -f1)
echo "    ✅ Downloaded: ${SIZE}"

# Step 2: Create GitHub Release
echo "🏷️   Creating GitHub release ${TAG}..."
RELEASE_BODY=$(cat <<BODY
## Eureka ${TAG}

${NOTES}

### Installation
1. Download the APK below
2. Enable **Install from Unknown Sources** on your Android device (Settings → Security)
3. Open the downloaded APK to install
BODY
)

RELEASE_JSON=$(jq -n \
  --arg tag      "$TAG" \
  --arg name     "Eureka $TAG" \
  --arg body     "$RELEASE_BODY" \
  --argjson pre  "$PRERELEASE" \
  '{tag_name:$tag,target_commitish:"main",name:$name,body:$body,draft:false,prerelease:$pre}')

RELEASE_RESPONSE=$(curl -s -X POST \
  -H "$AUTH_HEADER" \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Content-Type: application/json" \
  "${API}/releases" \
  -d "$RELEASE_JSON")

RELEASE_ID=$(echo "$RELEASE_RESPONSE" | jq -r '.id // empty')
RELEASE_URL=$(echo "$RELEASE_RESPONSE" | jq -r '.html_url // empty')

if [[ -z "$RELEASE_ID" ]]; then
  echo "❌  Failed to create release:"
  echo "$RELEASE_RESPONSE" | jq .
  rm -f "$TEMP_APK"
  exit 1
fi

echo "    ✅ Release created: ${RELEASE_URL}"

# Step 3: Upload APK
echo "📤  Uploading APK to release..."
UPLOAD_URL="https://uploads.github.com/repos/${REPO}/releases/${RELEASE_ID}/assets?name=${APK_FILENAME}"

UPLOAD_RESPONSE=$(curl -s -X POST \
  -H "$AUTH_HEADER" \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Content-Type: application/vnd.android.package-archive" \
  --data-binary @"${TEMP_APK}" \
  "$UPLOAD_URL")

DOWNLOAD_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.browser_download_url // empty')

if [[ -z "$DOWNLOAD_URL" ]]; then
  echo "❌  Failed to upload APK:"
  echo "$UPLOAD_RESPONSE" | jq .
  rm -f "$TEMP_APK"
  exit 1
fi

rm -f "$TEMP_APK"

echo "    ✅ APK uploaded: ${DOWNLOAD_URL}"
echo ""
echo "🎉  Release complete!"
echo "   GitHub Release : ${RELEASE_URL}"
echo "   Download Page  : http://eureka.vercel.app/app"
echo ""
