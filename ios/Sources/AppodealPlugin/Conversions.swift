import Foundation
import Appodeal
import StackConsentManager

/// Converts between the plugin's values, which match `react-native-appodeal`'s,
/// and the SDK's. The bit flags differ: the SDK's own constants are not the
/// ones the JavaScript side uses.
enum Conversions {
    static let interstitial = 1 << 0
    static let banner = 1 << 2
    static let bannerBottom = 1 << 3
    static let bannerTop = 1 << 4
    static let rewardedVideo = 1 << 5
    static let native = 1 << 7
    static let mrec = 1 << 8
    /// `AppodealAdType.ALL` on the JavaScript side.
    static let all = interstitial | banner | bannerBottom | bannerTop | rewardedVideo | mrec

    static func adType(_ types: Int) -> AppodealAdType {
        var result: AppodealAdType = []
        if types & interstitial != 0 { result.insert(.interstitial) }
        if types & (banner | bannerBottom | bannerTop) != 0 { result.insert(.banner) }
        if types & rewardedVideo != 0 { result.insert(.rewardedVideo) }
        if types & native != 0 { result.insert(.nativeAd) }
        if types & mrec != 0 { result.insert(.MREC) }
        return result
    }

    static func jsAdType(_ type: AppodealAdType) -> Int {
        var result = 0
        if type.contains(.interstitial) { result |= interstitial }
        if type.contains(.banner) { result |= banner }
        if type.contains(.rewardedVideo) { result |= rewardedVideo }
        if type.contains(.nativeAd) { result |= native }
        if type.contains(.MREC) { result |= mrec }
        return result
    }

    /// The single style `show` and `isLoaded` take, picked in the same order
    /// as react-native-appodeal.
    static func showStyle(_ types: Int) -> AppodealShowStyle? {
        if types & interstitial != 0 { return .interstitial }
        if types & bannerBottom != 0 { return .bannerBottom }
        if types & bannerTop != 0 { return .bannerTop }
        if types & rewardedVideo != 0 { return .rewardedVideo }
        return nil
    }

    static func logLevel(_ value: String?) -> APDLogLevel {
        switch value?.lowercased() {
        case "debug": return .debug
        case "verbose": return .verbose
        case "none", "off": return .off
        default: return .info
        }
    }

    /// `AppodealConsentStatus` on the JavaScript side shares the SDK's values.
    static func consentStatus(_ status: ConsentStatus) -> Int {
        return Int(status.rawValue)
    }

    /// `AppodealPrivacyOptionsStatus` on the JavaScript side: unknown 0,
    /// required 1, not required 2. The SDK orders them differently.
    static func privacyOptionsStatus(_ status: PrivacyOptionsStatus) -> Int {
        switch status {
        case .required: return 1
        case .notRequired: return 2
        default: return 0
        }
    }

    static func purchaseType(_ value: Int?) -> APDPurchaseType {
        return APDPurchaseType(rawValue: UInt(max(value ?? 0, 0))) ?? .consumable
    }
}
