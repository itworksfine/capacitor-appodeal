import Foundation
import Capacitor
import Appodeal
import StackConsentManager

/// A port of `react-native-appodeal`'s iOS module to Capacitor. Each method
/// makes the same SDK call as its React Native counterpart; values come in
/// through the call's options and go back through `resolve`.
@objc(AppodealPlugin)
public class AppodealPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppodealPlugin"
    public let jsName = "Appodeal"
    public let pluginMethods: [CAPPluginMethod] = [
        "initialize", "isInitialized", "show", "isLoaded", "canShow", "hide", "cache", "setAutoCache",
        "isPrecache", "setTabletBanners", "setSmartBanners", "setBannerAnimation", "setChildDirectedTreatment",
        "consentStatus", "revokeConsent", "requestConsentInfoUpdate", "showConsentFormIfNeeded", "showConsentForm",
        "privacyOptionsRequirementStatus", "showPrivacyOptionsForm", "setNonPersonalized", "setTesting",
        "setLogLevel", "setTriggerPrecacheCallbacks", "disableNetwork", "getVersion", "getPlatformSdkVersion",
        "setUserId", "setExtrasValue", "setCustomStateValue", "getRewardParameters", "predictedEcpm",
        "trackInAppPurchase", "validateAndTrackInAppPurchase", "trackEvent", "setBidonEndpoint", "getBidonEndpoint"
    ].map { CAPPluginMethod(name: $0, returnType: CAPPluginReturnPromise) }

    /// Remembered for the consent request, which needs it as the SDK does.
    private var childDirected = false

    /// Remembered for the banner height, which the SDK does not always have
    /// at the moment it reports a load.
    private var tabletBanners = false

    /// An `initialize` call waiting on the SDK, with its timeout.
    private var pendingInitialization: (call: CAPPluginCall, timeout: DispatchWorkItem)?

    private static let defaultInitializationTimeoutMs = 30_000

    private var rootViewController: UIViewController? {
        return bridge?.viewController
    }

    /// Runs `body` on the main thread, where the SDK expects its calls.
    private func onMain(_ body: @escaping () -> Void) {
        DispatchQueue.main.async(execute: body)
    }

    private func adTypes(_ call: CAPPluginCall, _ key: String = "adTypes") -> Int {
        return call.getInt(key) ?? 0
    }

    private func placement(_ call: CAPPluginCall) -> String {
        return call.getString("placement") ?? "default"
    }

    private func requireString(_ call: CAPPluginCall, _ key: String) -> String? {
        guard let value = call.getString(key), !value.isEmpty else {
            call.reject("\(key) is required", "INVALID_ARGUMENT")
            return nil
        }
        return value
    }

    /// The call's `value` option as the SDK takes it, `nil` for null.
    private func plainValue(_ call: CAPPluginCall) -> Any? {
        guard let value = call.options["value"], !(value is NSNull) else {
            return nil
        }
        return value
    }

    // Initialization

    @objc func initialize(_ call: CAPPluginCall) {
        guard let appKey = requireString(call, "appKey") else { return }
        let types = Conversions.adType(adTypes(call))
        let wait = call.getBool("waitForInitialization") ?? false
        let timeoutMs = call.getInt("initializationTimeoutMs") ?? AppodealPlugin.defaultInitializationTimeoutMs
        onMain {
            Appodeal.setFramework(.cordova, version: "capacitor-\(pluginVersion)")
            Appodeal.setInterstitialDelegate(self)
            Appodeal.setRewardedVideoDelegate(self)
            Appodeal.setBannerDelegate(self)
            Appodeal.setInitializationDelegate(self)
            Appodeal.setAdRevenueDelegate(self)
            if wait, Appodeal.isInitialized(for: types) {
                call.resolve()
                return
            }
            Appodeal.initialize(withApiKey: appKey, types: types)
            guard wait else {
                call.resolve()
                return
            }
            // Settled once, by whichever comes first: the SDK's delegate or the
            // timeout. A second call while one waits replaces it.
            self.pendingInitialization?.timeout.cancel()
            self.pendingInitialization?.call.reject("Superseded by a later initialize call", "INITIALIZATION_SUPERSEDED")
            let timeout = DispatchWorkItem { [weak self] in
                guard let pending = self?.pendingInitialization, pending.call === call else { return }
                self?.pendingInitialization = nil
                call.reject("Appodeal did not initialize within \(timeoutMs)ms", "INITIALIZATION_TIMEOUT")
            }
            self.pendingInitialization = (call, timeout)
            DispatchQueue.main.asyncAfter(deadline: .now() + .milliseconds(timeoutMs), execute: timeout)
        }
    }

    @objc func isInitialized(_ call: CAPPluginCall) {
        let types = Conversions.adType(adTypes(call))
        onMain { call.resolve(["isInitialized": Appodeal.isInitialized(for: types)]) }
    }

    // Showing ads

    @objc func show(_ call: CAPPluginCall) {
        guard let style = Conversions.showStyle(adTypes(call)) else {
            call.reject("adTypes must include an interstitial, rewarded video or banner", "INVALID_ARGUMENT")
            return
        }
        let placement = self.placement(call)
        onMain {
            Appodeal.showAd(style, forPlacement: placement, rootViewController: self.rootViewController)
            call.resolve()
        }
    }

    @objc func isLoaded(_ call: CAPPluginCall) {
        let style = Conversions.showStyle(adTypes(call))
        onMain {
            call.resolve(["isLoaded": style.map { Appodeal.isReadyForShow(with: $0) } ?? false])
        }
    }

    @objc func canShow(_ call: CAPPluginCall) {
        let types = Conversions.adType(adTypes(call))
        let placement = self.placement(call)
        onMain { call.resolve(["canShow": Appodeal.canShow(types, forPlacement: placement)]) }
    }

    @objc func hide(_ call: CAPPluginCall) {
        // The SDK can hide only the banner; any banner flag hides it, as on
        // Android, and other types are a no-op rather than an error.
        let hidesBanner = Conversions.adType(adTypes(call)).contains(.banner)
        onMain {
            if hidesBanner {
                Appodeal.hideBanner()
            }
            call.resolve()
        }
    }

    @objc func cache(_ call: CAPPluginCall) {
        let types = Conversions.adType(adTypes(call))
        onMain {
            Appodeal.cacheAd(types)
            call.resolve()
        }
    }

    @objc func setAutoCache(_ call: CAPPluginCall) {
        let types = Conversions.adType(adTypes(call))
        let value = call.getBool("value") ?? true
        onMain {
            Appodeal.setAutocache(value, types: types)
            call.resolve()
        }
    }

    @objc func isPrecache(_ call: CAPPluginCall) {
        let types = Conversions.adType(adTypes(call))
        onMain { call.resolve(["isPrecache": Appodeal.isPrecacheAd(types)]) }
    }

    // Banner settings

    @objc func setTabletBanners(_ call: CAPPluginCall) {
        let tablet = call.getBool("value") ?? false
        let size = tablet ? kAppodealUnitSize_728x90 : kAppodealUnitSize_320x50
        onMain {
            self.tabletBanners = tablet
            Appodeal.setPreferredBannerAdSize(size)
            call.resolve()
        }
    }

    @objc func setSmartBanners(_ call: CAPPluginCall) {
        let value = call.getBool("value") ?? false
        onMain {
            Appodeal.setSmartBannersEnabled(value)
            call.resolve()
        }
    }

    @objc func setBannerAnimation(_ call: CAPPluginCall) {
        let value = call.getBool("value") ?? false
        onMain {
            Appodeal.setBannerAnimationEnabled(value)
            call.resolve()
        }
    }

    @objc func setChildDirectedTreatment(_ call: CAPPluginCall) {
        let value = call.getBool("value") ?? false
        onMain {
            self.childDirected = value
            Appodeal.setChildDirectedTreatment(value)
            call.resolve()
        }
    }

    // Consent

    private func consentResult() -> [String: Any] {
        return ["status": Conversions.consentStatus(ConsentManager.shared.status)]
    }

    @objc func consentStatus(_ call: CAPPluginCall) {
        onMain { call.resolve(self.consentResult()) }
    }

    @objc func revokeConsent(_ call: CAPPluginCall) {
        onMain {
            ConsentManager.shared.revoke()
            call.resolve()
        }
    }

    @objc func requestConsentInfoUpdate(_ call: CAPPluginCall) {
        guard let appKey = requireString(call, "appKey") else { return }
        onMain {
            let parameters = ConsentUpdateRequestParameters(
                appKey: appKey,
                mediationSdkName: "appodeal",
                mediationSdkVersion: Appodeal.getVersion(),
                COPPA: self.childDirected
            )
            ConsentManager.shared.requestConsentInfoUpdate(parameters: parameters) { error in
                if let error = error {
                    call.reject(error.localizedDescription, "APD_REQUEST_CONSENT_INFO_UPDATE_ERROR", error)
                } else {
                    call.resolve(self.consentResult())
                }
            }
        }
    }

    @objc func showConsentFormIfNeeded(_ call: CAPPluginCall) {
        onMain {
            guard let root = self.rootViewController else {
                call.reject("No view controller to present the form from", "ACTIVITY_ERROR")
                return
            }
            ConsentManager.shared.loadAndPresentIfNeeded(rootViewController: root) { error in
                if let error = error {
                    call.reject(error.localizedDescription, "APD_SHOW_CONSENT_FORM_IF_NEEDED_ERROR", error)
                } else {
                    call.resolve(self.consentResult())
                }
            }
        }
    }

    @objc func showConsentForm(_ call: CAPPluginCall) {
        onMain {
            guard let root = self.rootViewController else {
                call.reject("No view controller to present the form from", "ACTIVITY_ERROR")
                return
            }
            ConsentManager.shared.load { dialog, error in
                guard let dialog = dialog, error == nil else {
                    call.reject(error?.localizedDescription ?? "The consent form failed to load", "APD_SHOW_CONSENT_FORM_ERROR", error)
                    return
                }
                dialog.present(rootViewController: root) { error in
                    if let error = error {
                        call.reject(error.localizedDescription, "APD_SHOW_CONSENT_FORM_ERROR", error)
                    } else {
                        call.resolve(self.consentResult())
                    }
                }
            }
        }
    }

    @objc func privacyOptionsRequirementStatus(_ call: CAPPluginCall) {
        onMain {
            let status = ConsentManager.shared.privacyOptionsRequirementStatus
            call.resolve(["status": Conversions.privacyOptionsStatus(status)])
        }
    }

    @objc func showPrivacyOptionsForm(_ call: CAPPluginCall) {
        onMain {
            guard let root = self.rootViewController else {
                call.reject("No view controller to present the form from", "ACTIVITY_ERROR")
                return
            }
            ConsentManager.shared.showPrivacyOptionsForm(rootViewController: root) { error in
                if let error = error {
                    call.reject(error.localizedDescription, "APD_SHOW_PRIVACY_OPTIONS_FORM_ERROR", error)
                } else {
                    call.resolve()
                }
            }
        }
    }

    @objc func setNonPersonalized(_ call: CAPPluginCall) {
        let value = call.getBool("value") ?? false
        onMain {
            Appodeal.setNonPersonalized(value)
            call.resolve()
        }
    }

    // Debugging

    @objc func setTesting(_ call: CAPPluginCall) {
        let value = call.getBool("value") ?? false
        onMain {
            Appodeal.setTestingEnabled(value)
            call.resolve()
        }
    }

    @objc func setLogLevel(_ call: CAPPluginCall) {
        let level = Conversions.logLevel(call.getString("value"))
        onMain {
            Appodeal.setLogLevel(level)
            call.resolve()
        }
    }

    @objc func setTriggerPrecacheCallbacks(_ call: CAPPluginCall) {
        let types = Conversions.adType(adTypes(call))
        let value = call.getBool("value") ?? false
        onMain {
            Appodeal.setTriggerPrecacheCallbacks(value, types: types)
            call.resolve()
        }
    }

    @objc func disableNetwork(_ call: CAPPluginCall) {
        guard let network = requireString(call, "network") else { return }
        let types = Conversions.adType(call.getInt("adTypes") ?? Conversions.all)
        onMain {
            Appodeal.disableNetwork(for: types, name: network)
            call.resolve()
        }
    }

    @objc func getVersion(_ call: CAPPluginCall) {
        call.resolve(["version": pluginVersion])
    }

    @objc func getPlatformSdkVersion(_ call: CAPPluginCall) {
        call.resolve(["version": Appodeal.getVersion()])
    }

    // Targeting and analytics

    @objc func setUserId(_ call: CAPPluginCall) {
        let id = call.getString("id") ?? ""
        onMain {
            Appodeal.setUserId(id)
            call.resolve()
        }
    }

    @objc func setExtrasValue(_ call: CAPPluginCall) {
        guard let key = requireString(call, "key") else { return }
        let value = plainValue(call)
        onMain {
            Appodeal.setExtrasValue(value, forKey: key)
            call.resolve()
        }
    }

    @objc func setCustomStateValue(_ call: CAPPluginCall) {
        guard let key = requireString(call, "key") else { return }
        let value = plainValue(call)
        onMain {
            Appodeal.setCustomStateValue(value, forKey: key)
            call.resolve()
        }
    }

    @objc func getRewardParameters(_ call: CAPPluginCall) {
        let placement = self.placement(call)
        onMain {
            let reward = Appodeal.reward(forPlacement: placement)
            call.resolve([
                "name": reward.currencyName ?? "",
                // The same text Android's `Double.toString()` gives, e.g. "1.0".
                "amount": String(Double(reward.amount))
            ])
        }
    }

    @objc func predictedEcpm(_ call: CAPPluginCall) {
        let types = Conversions.adType(adTypes(call, "adType"))
        onMain { call.resolve(["ecpm": Appodeal.predictedEcpm(for: types)]) }
    }

    @objc func trackInAppPurchase(_ call: CAPPluginCall) {
        guard let amount = call.getDouble("amount") else {
            call.reject("amount is required", "INVALID_ARGUMENT")
            return
        }
        guard let currency = requireString(call, "currency") else { return }
        onMain {
            Appodeal.track(inAppPurchase: NSNumber(value: amount), currency: currency)
            call.resolve()
        }
    }

    @objc func validateAndTrackInAppPurchase(_ call: CAPPluginCall) {
        let price: String? = call.getDouble("price").map { String($0) } ?? call.getString("price")
        let parameters = call.getObject("additionalParameters")
        onMain {
            Appodeal.validateAndTrack(
                inAppPurchase: call.getString("productId"),
                type: Conversions.purchaseType(call.getInt("productType")),
                price: price,
                currency: call.getString("currency"),
                transactionId: call.getString("transactionId"),
                additionalParameters: parameters,
                success: { response in
                    call.resolve(response as? [String: Any] ?? [:])
                },
                failure: { error in
                    call.reject(error?.localizedDescription ?? "Validation failed", "APD_VALIDATE_PURCHASE_ERROR", error)
                }
            )
        }
    }

    @objc func trackEvent(_ call: CAPPluginCall) {
        guard let name = requireString(call, "name") else { return }
        let parameters = call.getObject("parameters")
        onMain {
            Appodeal.trackEvent(name, customParameters: parameters)
            call.resolve()
        }
    }

    @objc func setBidonEndpoint(_ call: CAPPluginCall) {
        guard let endpoint = requireString(call, "endpoint") else { return }
        onMain {
            Appodeal.setBidonEndpoint(endpoint)
            call.resolve()
        }
    }

    @objc func getBidonEndpoint(_ call: CAPPluginCall) {
        onMain {
            let endpoint: Any = Appodeal.getBidonEndpoint() ?? NSNull()
            call.resolve(["endpoint": endpoint])
        }
    }

    // Events

    private static let retainedEvents: Set<String> = ["onAppodealInitialized", "onBannerLoaded"]

    func emit(_ name: String, _ data: [String: Any] = [:]) {
        // Initialization, and the first banner, can finish before the page has
        // added its listener; those events are kept until it does.
        notifyListeners(name, data: data, retainUntilConsumed: AppodealPlugin.retainedEvents.contains(name))
    }
}

// The SDK's delegate protocols are all-optional Objective-C protocols, so a
// method whose Swift name did not import as expected would compile and then
// never be called. Each one is pinned to its Objective-C selector.

extension AppodealPlugin: AppodealInitializationDelegate {
    @objc(appodealSDKDidInitialize)
    public func appodealSDKDidInitialize() {
        // The iOS SDK reports no per-network errors; the list is there so the
        // payload matches Android's.
        emit("onAppodealInitialized", ["errors": [String]()])
        if let pending = pendingInitialization {
            pendingInitialization = nil
            pending.timeout.cancel()
            pending.call.resolve()
        }
    }
}

extension AppodealPlugin: AppodealAdRevenueDelegate {
    @objc(didReceiveRevenueForAd:)
    public func didReceiveRevenue(forAd ad: AppodealAdRevenue) {
        emit("onAppodealDidReceiveRevenue", [
            "networkName": ad.networkName,
            "adUnitName": ad.adUnitName,
            "placement": ad.placement,
            "revenuePrecision": ad.revenuePrecision,
            "demandSource": ad.demandSource,
            "currency": ad.currency,
            "revenue": ad.revenue,
            "adType": Conversions.jsAdType(ad.adType)
        ])
    }
}

extension AppodealPlugin: AppodealBannerDelegate {
    @objc(bannerDidLoadAdIsPrecache:)
    public func bannerDidLoadAdIsPrecache(_ precache: Bool) {
        // The banner view may not be laid out yet when the load is reported,
        // in which case its frame is empty; the size that was asked for is
        // what it will take.
        let measured = Appodeal.banner()?.frame.height ?? 0
        let height = measured > 0 ? measured : (tabletBanners ? 90 : 50)
        emit("onBannerLoaded", [
            "isPrecache": precache,
            "height": height
        ])
    }

    @objc(bannerDidFailToLoadAd)
    public func bannerDidFailToLoadAd() {
        emit("onBannerFailedToLoad")
    }

    @objc(bannerDidShow)
    public func bannerDidShow() {
        emit("onBannerShown")
    }

    @objc(bannerDidExpired)
    public func bannerDidExpired() {
        emit("onBannerExpired")
    }

    @objc(bannerDidClick)
    public func bannerDidClick() {
        emit("onBannerClicked")
    }
}

extension AppodealPlugin: AppodealInterstitialDelegate {
    @objc(interstitialDidLoadAdIsPrecache:)
    public func interstitialDidLoadAdIsPrecache(_ precache: Bool) {
        emit("onInterstitialLoaded", ["isPrecache": precache])
    }

    @objc(interstitialDidFailToLoadAd)
    public func interstitialDidFailToLoadAd() {
        emit("onInterstitialFailedToLoad")
    }

    @objc(interstitialDidExpired)
    public func interstitialDidExpired() {
        emit("onInterstitialExpired")
    }

    @objc(interstitialDidFailToPresent)
    public func interstitialDidFailToPresent() {
        emit("onInterstitialFailedToShow")
    }

    @objc(interstitialWillPresent)
    public func interstitialWillPresent() {
        emit("onInterstitialShown")
    }

    @objc(interstitialDidDismiss)
    public func interstitialDidDismiss() {
        emit("onInterstitialClosed")
    }

    @objc(interstitialDidClick)
    public func interstitialDidClick() {
        emit("onInterstitialClicked")
    }
}

extension AppodealPlugin: AppodealRewardedVideoDelegate {
    @objc(rewardedVideoDidLoadAdIsPrecache:)
    public func rewardedVideoDidLoadAdIsPrecache(_ precache: Bool) {
        emit("onRewardedVideoLoaded", ["isPrecache": precache])
    }

    @objc(rewardedVideoDidFailToLoadAd)
    public func rewardedVideoDidFailToLoadAd() {
        emit("onRewardedVideoFailedToLoad")
    }

    @objc(rewardedVideoDidFailToPresentWithError:)
    public func rewardedVideoDidFailToPresentWithError(_ error: Error) {
        emit("onRewardedVideoFailedToShow", ["message": error.localizedDescription])
    }

    @objc(rewardedVideoDidExpired)
    public func rewardedVideoDidExpired() {
        emit("onRewardedVideoExpired")
    }

    @objc(rewardedVideoDidPresent)
    public func rewardedVideoDidPresent() {
        emit("onRewardedVideoShown")
    }

    @objc(rewardedVideoDidClick)
    public func rewardedVideoDidClick() {
        emit("onRewardedVideoClicked")
    }

    @objc(rewardedVideoWillDismissAndWasFullyWatched:)
    public func rewardedVideoWillDismissAndWasFullyWatched(_ wasFullyWatched: Bool) {
        emit("onRewardedVideoClosed", ["isFinished": wasFullyWatched])
    }

    @objc(rewardedVideoDidFinish:name:)
    public func rewardedVideoDidFinish(_ rewardAmount: Float, name rewardName: String?) {
        // A Double, as on Android, so 0.1 does not arrive as 0.10000000149.
        emit("onRewardedVideoFinished", ["amount": Double(rewardAmount), "currency": rewardName ?? ""])
    }
}
