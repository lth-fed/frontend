// swift-tools-version: 5.9
import PackageDescription

// DO NOT MODIFY THIS FILE - managed by Capacitor CLI commands
let package = Package(
    name: "CapApp-SPM",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapApp-SPM",
            targets: ["CapApp-SPM"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.2.0"),
        .package(name: "CapacitorCommunityScreenBrightness", path: "../../../node_modules/.pnpm/@capacitor-community+screen-brightness@8.0.0_@capacitor+core@8.2.0/node_modules/@capacitor-community/screen-brightness"),
        .package(name: "CapacitorApp", path: "../../../node_modules/.pnpm/@capacitor+app@8.1.0_@capacitor+core@8.2.0/node_modules/@capacitor/app"),
        .package(name: "CapacitorDevice", path: "../../../node_modules/.pnpm/@capacitor+device@8.0.2_@capacitor+core@8.2.0/node_modules/@capacitor/device"),
        .package(name: "CapacitorHaptics", path: "../../../node_modules/.pnpm/@capacitor+haptics@8.0.2_@capacitor+core@8.2.0/node_modules/@capacitor/haptics"),
        .package(name: "CapacitorPreferences", path: "../../../node_modules/.pnpm/@capacitor+preferences@8.0.1_@capacitor+core@8.2.0/node_modules/@capacitor/preferences"),
        .package(name: "CapacitorPushNotifications", path: "../../../node_modules/.pnpm/@capacitor+push-notifications@8.1.2_@capacitor+core@8.2.0/node_modules/@capacitor/push-notifications"),
        .package(name: "CapacitorStatusBar", path: "../../../node_modules/.pnpm/@capacitor+status-bar@8.0.2_@capacitor+core@8.2.0/node_modules/@capacitor/status-bar"),
        .package(name: "CapgoCapacitorInappbrowser", path: "../../../node_modules/.pnpm/@capgo+capacitor-inappbrowser@8.15.3_@capacitor+core@8.2.0/node_modules/@capgo/capacitor-inappbrowser")
    ],
    targets: [
        .target(
            name: "CapApp-SPM",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "CapacitorCommunityScreenBrightness", package: "CapacitorCommunityScreenBrightness"),
                .product(name: "CapacitorApp", package: "CapacitorApp"),
                .product(name: "CapacitorDevice", package: "CapacitorDevice"),
                .product(name: "CapacitorHaptics", package: "CapacitorHaptics"),
                .product(name: "CapacitorPreferences", package: "CapacitorPreferences"),
                .product(name: "CapacitorPushNotifications", package: "CapacitorPushNotifications"),
                .product(name: "CapacitorStatusBar", package: "CapacitorStatusBar"),
                .product(name: "CapgoCapacitorInappbrowser", package: "CapgoCapacitorInappbrowser")
            ]
        )
    ]
)
