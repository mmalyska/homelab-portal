# CI/CD Setup

## Overview

| Workflow | Trigger | Purpose |
|---|---|---|
| `ci.yml` | Every push/PR to `main` | Lint + typecheck + format check |
| `android-build.yml` | Manual dispatch | Build AAB or APK artifact |
| `ios-build.yml` | Manual dispatch | Build IPA (ad-hoc or App Store) + optional TestFlight upload |

**Build input — `distribution`:**
- Android: `aab` (for Play Store) or `apk` (for direct install)
- iOS: `ad-hoc` (for device testing) or `app-store` (for TestFlight/App Store)

**CI uses `xcodebuild`/`gradlew` directly.** Fastlane is only used in the iOS pipeline for the TestFlight upload step (`fastlane beta`), and for full local builds. See [Local Builds](#local-builds).

Builds run `expo prebuild --clean` at CI time — `ios/` and `android/` are not committed to the repo.

---

## Android Setup

### 1. Generate Keystore

```bash
keytool -genkey -v \
  -keystore release.keystore \
  -alias homelab-portal \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Store the passwords and alias securely — they cannot be recovered.

### 2. Encode Keystore for GitHub

```bash
base64 -i release.keystore | pbcopy   # macOS
base64 release.keystore               # Linux
```

### 3. Google Play Service Account

1. Google Play Console → Setup → API access
2. Link to a Google Cloud project
3. Create a service account with **Release Manager** role
4. Download the JSON key

### 4. GitHub Secrets — Android

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE` | Base64-encoded keystore file |
| `ANDROID_KEY_ALIAS` | Alias used during keytool generation |
| `ANDROID_KEY_PASSWORD` | Key password |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore store password |
| `GOOGLE_PLAY_JSON_KEY` | Contents of the service account JSON file |

---

## iOS Setup

### 1. Apple Developer Account

1. Enroll at [developer.apple.com](https://developer.apple.com) ($99/year)
2. Create an App ID: `com.mmalyska.homelabportal`
3. Create the app record in App Store Connect

### 2. Distribution Certificate

1. Xcode → Settings → Accounts → Manage Certificates → Add (`+`) → Apple Distribution
2. Export the certificate: Keychain Access → find "Apple Distribution" → Export as `.p12`
3. Encode for GitHub:

```bash
base64 -i certificate.p12 | pbcopy
```

### 3. Provisioning Profiles

The iOS workflow supports two distribution methods and requires a separate provisioning profile for each.

**Ad-hoc profile** (for device testing):
1. [developer.apple.com](https://developer.apple.com) → Profiles → Create → **Ad Hoc**
2. App ID: `com.mmalyska.homelabportal`, select your distribution certificate and registered devices
3. Download and encode:

```bash
base64 -i homelab-portal-adhoc.mobileprovision | pbcopy
```

**App Store profile** (for TestFlight/App Store):
1. [developer.apple.com](https://developer.apple.com) → Profiles → Create → **App Store Connect**
2. App ID: `com.mmalyska.homelabportal`, select your distribution certificate
3. Download and encode:

```bash
base64 -i homelab-portal-appstore.mobileprovision | pbcopy
```

### 4. App Store Connect API Key

1. App Store Connect → Users and Access → Integrations → App Store Connect API
2. Generate key with **App Manager** role
3. Download the `.p8` file — only downloadable once
4. Note the **Key ID** and **Issuer ID**

```bash
base64 -i AuthKey_XXXXXXXX.p8 | pbcopy
```

### 5. ExportOptions.plist

`ExportOptions.plist` is generated **inline** during the CI run from the provisioning profile UUID and team ID — it is not committed to the repo.

### 6. GitHub Secrets — iOS

| Secret | Value |
|---|---|
| `APPLE_CERTIFICATE` | Base64-encoded `.p12` distribution certificate |
| `APPLE_CERTIFICATE_PASSWORD` | Password set when exporting `.p12` |
| `APPLE_PROVISIONING_PROFILE_ADHOC` | Base64-encoded ad-hoc `.mobileprovision` |
| `APPLE_PROVISIONING_PROFILE_APPSTORE` | Base64-encoded App Store `.mobileprovision` |
| `KEYCHAIN_PASSWORD` | Any secure password for the temporary CI keychain |
| `ASC_KEY_ID` | App Store Connect API Key ID |
| `ASC_ISSUER_ID` | App Store Connect Issuer ID |
| `ASC_API_KEY_CONTENT` | Base64-encoded `.p8` key content |

---

## Local Builds (Fastlane)

```bash
bundle install

# iOS — build + upload to TestFlight
bundle exec fastlane ios release

# Android — build + upload to Play Store internal track
bundle exec fastlane android release
```

Required env vars for local (use a `.env` file — do not commit):

```bash
# Android
ANDROID_KEYSTORE_BASE64=...
ANDROID_KEY_ALIAS=...
ANDROID_KEY_PASSWORD=...
ANDROID_KEYSTORE_PASSWORD=...
GOOGLE_PLAY_JSON_KEY=...

# iOS
ASC_KEY_ID=...
ASC_ISSUER_ID=...
ASC_API_KEY_CONTENT=...
MATCH_GIT_URL=...
MATCH_PASSWORD=...
```

### Fastlane Match Setup (iOS local signing)

Match stores encrypted certificates in a private Git repo for local sharing:

```bash
bundle exec fastlane match init       # configure private certs repo
bundle exec fastlane match appstore   # generate and store certificates
```

---

## Build Numbers

`CURRENT_PROJECT_VERSION` is set to `github.run_number` in CI for auto-incrementing iOS builds. For local Fastlane builds it defaults to `1` — override via env if needed:

```bash
BUILD_NUMBER=42 bundle exec fastlane ios release
```
