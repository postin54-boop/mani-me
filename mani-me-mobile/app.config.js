export default {
  expo: {
    name: "Mani Me",
    slug: "mani-me-mobile",
    scheme: "manime",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
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
      bundleIdentifier: "com.manime.app"
    },
    android: {
      compileSdkVersion: 34,
      targetSdkVersion: 34,
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
        "@stripe/stripe-react-native",
        {
          merchantIdentifier: "merchant.com.manime.app",
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
      stripePublishableKey: process.env.STRIPE_KEY || process.env.EXPO_PUBLIC_STRIPE_KEY || "pk_test_51SkMiJRx556lxcckTLrW8xVroC3TflDIKMBfSdat6KAoaLXO4MQPBkUNi4F0pLizmMp6lmHjhxQJGoXu6Iq3PrnB00QfalR70y",
      environment: process.env.NODE_ENV || "development",
      eas: {
        projectId: "3638c63b-4837-422f-a329-b7e169066774"
      }
    },
    owner: "postin54"
  }
};
