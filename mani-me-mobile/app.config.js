export default {
  expo: {
    name: "Mani Me",
    slug: "mani-me-mobile",
    scheme: "manime",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/adaptive-icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/logo.png",
      resizeMode: "contain",
      backgroundColor: "#0B1F33"
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.manime.app",
      buildNumber: "5",
      icon: "./assets/adaptive-icon.png",
      infoPlist: {
        NSPhotoLibraryUsageDescription: "Allow Mani Me to access your photos to set a profile picture.",
        NSCameraUsageDescription: "Allow Mani Me to use your camera to take a profile picture.",
        ITSAppUsesNonExemptEncryption: false
      },
      entitlements: {
        "com.apple.developer.in-app-payments": ["merchant.manime.delivery"]
      }
    },
    android: {
      compileSdkVersion: 35,
      targetSdkVersion: 35,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0B1A33"
      },
      package: "com.manime.app",
      permissions: [
        "CAMERA",
        "NOTIFICATIONS",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-secure-store",
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow Mani Me to access your photos to set a profile picture.",
          "cameraPermission": "Allow Mani Me to use your camera to take a profile picture."
        }
      ],
      [
        "@stripe/stripe-react-native",
        {
          merchantIdentifier: "merchant.manime.delivery",
          enableGooglePay: true
        }
      ]
    ],
    extra: {
      // Environment-specific configuration
      // For local development, use your machine's IP address
      // For production, use the deployed API URL
      // apiUrl is now controlled by src/api.js USE_LOCAL_BACKEND flag
      apiUrl: null,
      stripePublishableKey: process.env.STRIPE_KEY || process.env.EXPO_PUBLIC_STRIPE_KEY || "",
      environment: process.env.NODE_ENV || "development",
      // App Store required URLs
      privacyPolicyUrl: "https://www.manime.co.uk/privacy.html",
      termsOfServiceUrl: "https://www.manime.co.uk/terms.html",
      eas: {
        projectId: "3638c63b-4837-422f-a329-b7e169066774"
      }
    },
    owner: "postin54"
  }
};
