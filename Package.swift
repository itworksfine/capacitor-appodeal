// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "ItworksfineCapacitorAppodeal",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "ItworksfineCapacitorAppodeal",
            targets: ["AppodealPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0"),
        .package(url: "https://github.com/appodeal/Appodeal-Swift-Package.git", from: "4.4.0"),
        .package(url: "https://github.com/appodeal/Appodeal-Swift-Package-IAB.git", from: "4040000.0.0")
    ],
    targets: [
        .target(
            name: "AppodealPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "AppodealSDK", package: "Appodeal-Swift-Package"),
                .product(name: "AppodealIABAdapter", package: "Appodeal-Swift-Package-IAB")
            ],
            path: "ios/Sources/AppodealPlugin",
            // Appodeal's static frameworks add methods through Objective-C categories,
            // which the linker drops without -ObjC.
            linkerSettings: [.unsafeFlags(["-Xlinker", "-ObjC"])]),
        .testTarget(
            name: "AppodealPluginTests",
            dependencies: [
                "AppodealPlugin",
                .product(name: "AppodealSDK", package: "Appodeal-Swift-Package")
            ],
            path: "ios/Tests/AppodealPluginTests")
    ]
)