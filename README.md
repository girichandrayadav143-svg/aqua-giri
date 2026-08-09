# AQUA FARMING - MERN Stack & Mobile Store App (Vannamei Shrimp)

Production-grade MERN Stack web application and mobile app for **Bhatraju Raju**'s Vannamei shrimp farm, featuring username & password authentication, custom farm background, and mobile app store packaging.

---

## 🔑 Username & Password Demo Login Credentials

| Role | Name | Username | Password |
| :--- | :--- | :--- | :--- |
| **Owner** | Bhatraju Raju | `manthena` | `owner123` |
| **Owner** | Giri | `giri` | `owner@123` |
| **Supervisor** | Rajesh Kumar | `rajesh` | `super123` |
| **Servant** | Ramu | `ramu` | `servant123` |

*Note: You can click the quick login pills on the authentication screen to auto-fill credentials!*

---

## ⚡ How to Run the MERN Stack Node.js Server

### Step 1: Open Terminal in VS Code
1. Open VS Code in `c:\Users\giric\OneDrive\Desktop\AQUA`.
2. Press `Ctrl + ~` to open the integrated terminal.

### Step 2: Install Server Dependencies & Start
```bash
cd server
npm install
npm start
```

### Step 3: Open the Website
1. Open your browser at **`http://localhost:5000/app.html`**.
2. Use the demo login credentials below to sign in.

---

## 📱 How to Install on Mobile & Desktop

### Option 1: Direct PWA Install (Android, iPhone, iPad, Windows, Mac)
1. Open `http://localhost:5000` (or your hosted domain) in Google Chrome, Safari, or Edge.
2. On Android/Chrome: Click **"Install Aqua App"** top header button or browser menu **"Add to Home Screen"**.
3. On iPhone/Safari: Tap **Share Button** > **"Add to Home Screen"**.

### Option 2: Build Native Package for Google Play Store & Apple App Store (Capacitor)
To package into an `.apk` file for Google Play Store or Xcode project for Apple App Store:

1. Install Capacitor CLI in your project root:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
   npx cap init "AQUA FARMING" "com.aquafarming.app" --web-dir .
   ```
2. Build Android App (`.apk` for Google Play Store):
   ```bash
   npx cap add android
   npx cap copy
   npx cap open android
   ```
   *(Opens Android Studio where you can click **Build > Build APK / Bundle** for Play Store upload)*.

3. Build iOS App (`.ipa` for Apple App Store):
   ```bash
   npx cap add ios
   npx cap copy
   npx cap open ios
   ```
   *(Opens Xcode where you can archive and publish to the App Store)*.

---

## 📸 Background Image
The app utilizes your uploaded shrimp farm pond background (`assets/farm_background.png`) with an elegant dark glassmorphism overlay.

---

## 👨‍🌾 Designed for AQUA FARMING
*Owner: Bhatraju Raju*
