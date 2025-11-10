import "dotenv/config";

export default {
  expo: {
    name: "Instagram Project",
    slug: "instagram-project",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "com.instagram.clone",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.instagram.clone",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: ["expo-router"],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      apiBaseUrl: process.env.API_BASE_URL || "http://192.168.100.175:8080",
      apiPrefix: process.env.API_PREFIX || "/api/v1",
      env: process.env.NODE_ENV || "development",
    },
  },
};
