# UEORMS ERP – Mobile App Setup Guide

Flutter 3.27.4 · Dart 3.6.2 · Android + iOS

---

## Prerequisites

| Tool | Minimum version | How to install |
|------|----------------|----------------|
| Flutter SDK | 3.27.4 | Already at `C:\Users\Nisarg Bhavsar\flutter\` |
| Android Studio | Latest | https://developer.android.com/studio |
| Xcode (macOS only) | 15+ | Mac App Store |
| Node.js backend | running on port 5000 | `cd backend && npm run dev` |

---

## 1. Enable Windows Developer Mode (one-time)

Flutter on Windows requires Developer Mode for symlinks:

```powershell
start ms-settings:developers
```

Toggle **Developer Mode → On**, then restart your terminal.

---

## 2. Add Flutter to PATH permanently

```powershell
# Add to your PowerShell profile
Add-Content $PROFILE "`n`$env:PATH = `"`$env:USERPROFILE\flutter\bin;`$env:PATH`""
```

Or add `C:\Users\Nisarg Bhavsar\flutter\bin` to **System Environment Variables → PATH**.

---

## 3. Install dependencies

```bash
cd erp_mobile
flutter pub get
```

---

## 4. Configure Backend URL

Edit [lib/core/constants/api_constants.dart](lib/core/constants/api_constants.dart):

```dart
// For Android Emulator (localhost = 10.0.2.2):
const String kBaseUrl = 'http://10.0.2.2:5000/api';

// For iOS Simulator (localhost works directly):
const String kBaseUrl = 'http://localhost:5000/api';

// For physical device (use your machine's local IP):
const String kBaseUrl = 'http://192.168.x.x:5000/api';
```

---

## 5. Run the App

### Android (Emulator or physical device)
```bash
# List available devices
flutter devices

# Run on connected device
flutter run

# Run on specific device
flutter run -d emulator-5554
```

### iOS (macOS only)
```bash
cd ios && pod install && cd ..
flutter run -d iPhone
```

---

## 6. Build Release APK (Android)

```bash
# Debug APK for testing
flutter build apk --debug

# Release APK (requires signing)
flutter build apk --release

# App Bundle for Play Store
flutter build appbundle --release
```

Output: `build/app/outputs/flutter-apk/app-release.apk`

---

## 7. Build Release IPA (iOS – macOS only)

```bash
flutter build ipa --release
```

---

## 8. App Signing

### Android
1. Generate a keystore:
```bash
keytool -genkey -v -keystore ~/erp-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias erp
```
2. Create `android/key.properties`:
```properties
storePassword=<your-password>
keyPassword=<your-password>
keyAlias=erp
storeFile=<path-to>/erp-release.jks
```
3. Update `android/app/build.gradle` to reference the keystore.

### iOS
Sign through Xcode → Runner → Signing & Capabilities with your Apple Developer account.

---

## Project Structure

```
erp_mobile/
├── lib/
│   ├── main.dart                    # App entry point
│   ├── core/
│   │   ├── constants/               # API URLs, colors, strings
│   │   ├── models/                  # User, etc.
│   │   ├── services/                # ApiService (Dio), AuthService, StorageService
│   │   └── providers/               # AuthProvider (ChangeNotifier)
│   ├── navigation/
│   │   ├── app_router.dart          # GoRouter – all routes
│   │   └── main_shell.dart          # Bottom navigation bar (7 tabs)
│   └── features/
│       ├── auth/                    # Splash + Login screens
│       ├── dashboard/               # Home dashboard
│       ├── hr/                      # Employees, Leave, Attendance
│       ├── payroll/                 # Payroll hub, Payslips, Cycles, Disbursements
│       ├── crm/                     # Customers, Leads, Pipeline
│       ├── inventory/               # Stock items, Warehouses, Movements
│       ├── finance/                 # Invoices, Expenses, Bills
│       ├── more/                    # Profile + logout
│       └── widgets/                 # Shared reusable widgets
├── android/                         # Android platform files
├── ios/                             # iOS platform files
└── assets/
    ├── icons/                       # App icons
    ├── images/                      # Images
    └── lottie/                      # Lottie animations
```

---

## Modules Included

| Module | Screens |
|--------|---------|
| Auth | Splash, Login |
| Dashboard | Stats grid, Module shortcuts |
| HR | Hub, Employees, Leave Requests, Attendance, Employee Detail |
| Payroll | Hub, Payslips, Payroll Cycles, Disbursements |
| CRM | Hub, Customers, Leads, Pipeline (Kanban) |
| Inventory | Hub, Stock Items, Warehouses, Stock Movements |
| Finance | Hub, Invoices, Expenses, Bills |
| More | Profile, navigation, Logout |

---

## Troubleshooting

### `Building with plugins requires symlink support`
→ Enable Windows Developer Mode (Section 1 above)

### `Connection refused` on emulator
→ Replace `localhost` with `10.0.2.2` in `api_constants.dart`

### `Namespace not found` (Android build)
→ Run `flutter clean && flutter pub get`

### iOS `pod install` fails
→ Run `sudo gem install cocoapods && pod repo update`

### JWT token issues
→ Check that your backend `/auth/login` returns `{ token: "..." }` or `{ accessToken: "..." }`

---

## Backend Requirements

The mobile app connects to the same backend as the web frontend. Ensure:

1. Backend is running: `cd backend && npm run dev` (port 5000)
2. CORS allows your device IP:
```js
// backend/src/index.js or app.js
app.use(cors({
  origin: ['http://localhost:5174', 'http://10.0.2.2:5000', '*'] // dev only
}));
```
3. JWT auth endpoints exist at `/api/auth/login` and `/api/auth/me`
