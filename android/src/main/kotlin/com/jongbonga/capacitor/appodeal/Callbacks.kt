package com.jongbonga.capacitor.appodeal

import com.appodeal.ads.BannerCallbacks
import com.appodeal.ads.InterstitialCallbacks
import com.appodeal.ads.RewardedVideoCallbacks
import com.appodeal.ads.revenue.AdRevenueCallbacks
import com.appodeal.ads.revenue.RevenueInfo
import com.getcapacitor.JSObject

internal typealias Emit = (String, JSObject?) -> Unit

/**
 * Forwards the SDK's callbacks as plugin events, with the names and payloads
 * `react-native-appodeal` uses.
 */
internal class InterstitialEvents(private val emit: Emit) : InterstitialCallbacks {
    override fun onInterstitialLoaded(isPrecache: Boolean) =
        emit("onInterstitialLoaded", JSObject().put("isPrecache", isPrecache))

    override fun onInterstitialFailedToLoad() = emit("onInterstitialFailedToLoad", null)

    override fun onInterstitialShowFailed() = emit("onInterstitialFailedToShow", null)

    override fun onInterstitialShown() = emit("onInterstitialShown", null)

    override fun onInterstitialClosed() = emit("onInterstitialClosed", null)

    override fun onInterstitialClicked() = emit("onInterstitialClicked", null)

    override fun onInterstitialExpired() = emit("onInterstitialExpired", null)
}

internal class RewardedVideoEvents(private val emit: Emit) : RewardedVideoCallbacks {
    override fun onRewardedVideoLoaded(isPrecache: Boolean) =
        emit("onRewardedVideoLoaded", JSObject().put("isPrecache", isPrecache))

    override fun onRewardedVideoFailedToLoad() = emit("onRewardedVideoFailedToLoad", null)

    override fun onRewardedVideoShowFailed() = emit("onRewardedVideoFailedToShow", null)

    override fun onRewardedVideoShown() = emit("onRewardedVideoShown", null)

    override fun onRewardedVideoClosed(finished: Boolean) =
        emit("onRewardedVideoClosed", JSObject().put("isFinished", finished))

    override fun onRewardedVideoFinished(amount: Double, currency: String) =
        emit("onRewardedVideoFinished", JSObject().put("amount", amount).put("currency", currency))

    override fun onRewardedVideoExpired() = emit("onRewardedVideoExpired", null)

    override fun onRewardedVideoClicked() = emit("onRewardedVideoClicked", null)
}

internal class BannerEvents(private val emit: Emit) : BannerCallbacks {
    override fun onBannerLoaded(height: Int, isPrecache: Boolean) =
        emit("onBannerLoaded", JSObject().put("height", height).put("isPrecache", isPrecache))

    override fun onBannerFailedToLoad() = emit("onBannerFailedToLoad", null)

    override fun onBannerShown() = emit("onBannerShown", null)

    // Not reported, as in react-native-appodeal: a banner that fails to show
    // also fails to load, which is.
    override fun onBannerShowFailed() = Unit

    override fun onBannerClicked() = emit("onBannerClicked", null)

    override fun onBannerExpired() = emit("onBannerExpired", null)
}

internal class RevenueEvents(private val emit: Emit) : AdRevenueCallbacks {
    override fun onAdRevenueReceive(revenueInfo: RevenueInfo) = emit(
        "onAppodealDidReceiveRevenue",
        JSObject()
            .put("networkName", revenueInfo.networkName)
            .put("adUnitName", revenueInfo.adUnitName)
            .put("placement", revenueInfo.placement)
            .put("revenuePrecision", revenueInfo.revenuePrecision)
            .put("demandSource", revenueInfo.demandSource)
            .put("currency", revenueInfo.currency)
            .put("revenue", revenueInfo.revenue)
            .put("adType", Conversions.fromAppodealTypes(revenueInfo.adType)),
    )
}
