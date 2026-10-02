package com.jongbonga.capacitor.appodeal

import android.app.Activity
import android.os.Handler
import android.os.Looper
import com.appodeal.ads.Appodeal
import com.appodeal.ads.inapp.InAppPurchase
import com.appodeal.ads.inapp.InAppPurchaseValidateCallback
import com.appodeal.ads.service.ServiceError
import com.appodeal.consent.ConsentManager
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import org.json.JSONObject

/**
 * A port of `react-native-appodeal`'s Android module to Capacitor. Each method
 * makes the same SDK call as its React Native counterpart; values come in
 * through the call's options and go back through `resolve`.
 */
@CapacitorPlugin(name = "Appodeal")
class AppodealPlugin : Plugin() {
    private val main = Handler(Looper.getMainLooper())

    private val emit: Emit = { name, data ->
        // Initialization can finish before the page has added its listener.
        notifyListeners(name, data ?: JSObject(), name == "onAppodealInitialized")
    }

    /** Runs `body` on the main thread, where the SDK expects its calls. */
    private fun onMain(body: () -> Unit) = main.post(body)

    /** Like `onMain`, rejecting the call when there is no activity to work in. */
    private fun withActivity(call: PluginCall, body: (Activity) -> Unit) = onMain {
        val activity = activity
        if (activity == null) {
            call.reject("Unable to get current Activity", ERROR_ACTIVITY)
        } else {
            body(activity)
        }
    }

    private fun adTypes(call: PluginCall, key: String = "adTypes"): Int =
        Conversions.toAppodealTypes(call.getInt(key) ?: 0)

    private fun placement(call: PluginCall): String = call.getString("placement") ?: "default"

    // Initialization

    @PluginMethod
    fun initialize(call: PluginCall) {
        val appKey = call.getString("appKey")
        if (appKey.isNullOrEmpty()) {
            call.reject("appKey is required", ERROR_ARGUMENT)
            return
        }
        val types = adTypes(call)
        onMain {
            Appodeal.setFramework("capacitor", VERSION)
            Appodeal.setInterstitialCallbacks(InterstitialEvents(emit))
            Appodeal.setRewardedVideoCallbacks(RewardedVideoEvents(emit))
            Appodeal.setBannerCallbacks(BannerEvents(emit))
            Appodeal.setAdRevenueCallbacks(RevenueEvents(emit))
            Appodeal.setUseSafeArea(true)
            Appodeal.initialize(activity ?: context, appKey, types) { emit("onAppodealInitialized", null) }
            call.resolve()
        }
    }

    @PluginMethod
    fun isInitialized(call: PluginCall) {
        call.resolve(JSObject().put("isInitialized", Appodeal.isInitialized(adTypes(call))))
    }

    // Showing ads

    @PluginMethod
    fun show(call: PluginCall) {
        val types = adTypes(call)
        withActivity(call) {
            Appodeal.show(it, types, placement(call))
            call.resolve()
        }
    }

    @PluginMethod
    fun isLoaded(call: PluginCall) {
        call.resolve(JSObject().put("isLoaded", Appodeal.isLoaded(adTypes(call))))
    }

    @PluginMethod
    fun canShow(call: PluginCall) {
        call.resolve(JSObject().put("canShow", Appodeal.canShow(adTypes(call), placement(call))))
    }

    @PluginMethod
    fun hide(call: PluginCall) {
        val types = adTypes(call)
        withActivity(call) {
            Appodeal.hide(it, types)
            call.resolve()
        }
    }

    @PluginMethod
    fun cache(call: PluginCall) {
        val types = adTypes(call)
        withActivity(call) {
            Appodeal.cache(it, types)
            call.resolve()
        }
    }

    @PluginMethod
    fun setAutoCache(call: PluginCall) {
        Appodeal.setAutoCache(adTypes(call), call.getBoolean("value", true) ?: true)
        call.resolve()
    }

    @PluginMethod
    fun isPrecache(call: PluginCall) {
        call.resolve(JSObject().put("isPrecache", Appodeal.isPrecache(adTypes(call))))
    }

    // Banner settings

    @PluginMethod
    fun setTabletBanners(call: PluginCall) {
        Appodeal.set728x90Banners(call.getBoolean("value", false) ?: false)
        call.resolve()
    }

    @PluginMethod
    fun setSmartBanners(call: PluginCall) {
        Appodeal.setSmartBanners(call.getBoolean("value", false) ?: false)
        call.resolve()
    }

    @PluginMethod
    fun setBannerAnimation(call: PluginCall) {
        Appodeal.setBannerAnimation(call.getBoolean("value", false) ?: false)
        call.resolve()
    }

    @PluginMethod
    fun setChildDirectedTreatment(call: PluginCall) {
        Appodeal.setChildDirectedTreatment(call.getBoolean("value", false) ?: false)
        call.resolve()
    }

    // Consent

    @PluginMethod
    fun consentStatus(call: PluginCall) {
        call.resolve(JSObject().put("status", Conversions.consentStatus(ConsentManager.status)))
    }

    @PluginMethod
    fun revokeConsent(call: PluginCall) {
        ConsentManager.revoke(activity ?: context)
        call.resolve()
    }

    @PluginMethod
    fun requestConsentInfoUpdate(call: PluginCall) {
        val appKey = call.getString("appKey")
        if (appKey.isNullOrEmpty()) {
            call.reject("appKey is required", ERROR_ARGUMENT)
            return
        }
        withActivity(call) { Consent.requestInfoUpdate(call, it, appKey) }
    }

    @PluginMethod
    fun showConsentFormIfNeeded(call: PluginCall) = withActivity(call) { Consent.showFormIfNeeded(call, it) }

    @PluginMethod
    fun showConsentForm(call: PluginCall) = withActivity(call) { Consent.showForm(call, it) }

    @PluginMethod
    fun privacyOptionsRequirementStatus(call: PluginCall) {
        val status = Conversions.privacyOptionsStatus(ConsentManager.getPrivacyOptionsRequirementStatus())
        call.resolve(JSObject().put("status", status))
    }

    @PluginMethod
    fun showPrivacyOptionsForm(call: PluginCall) = withActivity(call) { Consent.showPrivacyOptionsForm(call, it) }

    @PluginMethod
    fun setNonPersonalized(call: PluginCall) {
        Appodeal.setNonPersonalized(call.getBoolean("value", false) ?: false)
        call.resolve()
    }

    // Debugging

    @PluginMethod
    fun setTesting(call: PluginCall) {
        Appodeal.setTesting(call.getBoolean("value", false) ?: false)
        call.resolve()
    }

    @PluginMethod
    fun setLogLevel(call: PluginCall) {
        Appodeal.setLogLevel(Conversions.logLevel(call.getString("value")))
        call.resolve()
    }

    @PluginMethod
    fun setTriggerPrecacheCallbacks(call: PluginCall) {
        Appodeal.setTriggerOnLoadedOnPrecache(adTypes(call), call.getBoolean("value", false) ?: false)
        call.resolve()
    }

    @PluginMethod
    fun disableNetwork(call: PluginCall) {
        val network = call.getString("network")
        if (network.isNullOrEmpty()) {
            call.reject("network is required", ERROR_ARGUMENT)
            return
        }
        val types = if (call.data.has("adTypes")) adTypes(call) else Conversions.toAppodealTypes(Conversions.ALL)
        Appodeal.disableNetwork(network, types)
        call.resolve()
    }

    @PluginMethod
    fun getVersion(call: PluginCall) {
        call.resolve(JSObject().put("version", VERSION))
    }

    @PluginMethod
    fun getPlatformSdkVersion(call: PluginCall) {
        call.resolve(JSObject().put("version", Appodeal.getVersion()))
    }

    // Targeting and analytics

    @PluginMethod
    fun setUserId(call: PluginCall) {
        Appodeal.setUserId(call.getString("id") ?: "")
        call.resolve()
    }

    @PluginMethod
    fun setExtrasValue(call: PluginCall) {
        val key = call.getString("key")
        if (key.isNullOrEmpty()) {
            call.reject("key is required", ERROR_ARGUMENT)
            return
        }
        when (val value = Conversions.plain(call.data.opt("value"))) {
            null -> Appodeal.setExtraData(key, null)
            is String -> Appodeal.setExtraData(key, value)
            is Boolean -> Appodeal.setExtraData(key, value)
            is Int -> Appodeal.setExtraData(key, value)
            is Long -> Appodeal.setExtraData(key, value.toInt())
            is Number -> Appodeal.setExtraData(key, value.toDouble())
            is Map<*, *> -> Appodeal.setExtraData(key, JSONObject(value))
            else -> Appodeal.setExtraData(key, value.toString())
        }
        call.resolve()
    }

    @PluginMethod
    fun setCustomStateValue(call: PluginCall) {
        val key = call.getString("key")
        if (key.isNullOrEmpty()) {
            call.reject("key is required", ERROR_ARGUMENT)
            return
        }
        when (val value = Conversions.plain(call.data.opt("value"))) {
            null -> Appodeal.setCustomFilter(key, null)
            is String -> Appodeal.setCustomFilter(key, value)
            is Boolean -> Appodeal.setCustomFilter(key, value)
            is Int -> Appodeal.setCustomFilter(key, value)
            is Long -> Appodeal.setCustomFilter(key, value.toInt())
            is Number -> Appodeal.setCustomFilter(key, value.toDouble())
            else -> Appodeal.setCustomFilter(key, value)
        }
        call.resolve()
    }

    @PluginMethod
    fun getRewardParameters(call: PluginCall) {
        val reward = Appodeal.getReward(placement(call))
        call.resolve(JSObject().put("name", reward.currency).put("amount", reward.amount.toString()))
    }

    @PluginMethod
    fun predictedEcpm(call: PluginCall) {
        call.resolve(JSObject().put("ecpm", Appodeal.getPredictedEcpm(adTypes(call, "adType"))))
    }

    @PluginMethod
    fun trackInAppPurchase(call: PluginCall) {
        val amount = call.getDouble("amount")
        val currency = call.getString("currency")
        if (amount == null || currency.isNullOrEmpty()) {
            call.reject("amount and currency are required", ERROR_ARGUMENT)
            return
        }
        Appodeal.trackInAppPurchase(activity ?: context, amount, currency)
        call.resolve()
    }

    @PluginMethod
    fun validateAndTrackInAppPurchase(call: PluginCall) {
        if (!call.data.has("productType")) {
            call.reject("productType is required", "MISSING_PRODUCT_TYPE")
            return
        }
        val builder = InAppPurchase.newBuilder(Conversions.purchaseType(call.getInt("productType")))
        call.getString("publicKey")?.let { builder.withPublicKey(it) }
        call.getString("signature")?.let { builder.withSignature(it) }
        call.getString("purchaseData")?.let { builder.withPurchaseData(it) }
        call.getString("purchaseToken")?.let { builder.withPurchaseToken(it) }
        call.data.optLong("timestamp", 0L).takeIf { it != 0L }?.let { builder.withPurchaseTimestamp(it) }
        call.getString("developerPayload")?.let { builder.withDeveloperPayload(it) }
        call.getString("orderId")?.let { builder.withOrderId(it) }
        call.getString("sku")?.let { builder.withSku(it) }
        call.getString("price")?.let { builder.withPrice(it) }
        call.getString("currency")?.let { builder.withCurrency(it) }
        call.data.optJSONObject("additionalParameters")?.let {
            builder.withAdditionalParams(Conversions.toStringMap(it))
        }

        Appodeal.validateInAppPurchase(
            activity ?: context,
            builder.build(),
            object : InAppPurchaseValidateCallback {
                override fun onInAppPurchaseValidateSuccess(purchase: InAppPurchase, errors: List<ServiceError>?) {
                    call.resolve(
                        JSObject()
                            .put("publicKey", purchase.publicKey)
                            .put("signature", purchase.signature)
                            .put("purchaseData", purchase.purchaseData)
                            .put("purchaseToken", purchase.purchaseToken)
                            .put("timestamp", purchase.purchaseTimestamp)
                            .put("developerPayload", purchase.developerPayload)
                            .put("orderId", purchase.orderId)
                            .put("sku", purchase.sku)
                            .put("price", purchase.price)
                            .put("currency", purchase.currency)
                            .put("productType", Conversions.purchaseTypeValue(purchase.type)),
                    )
                }

                override fun onInAppPurchaseValidateFail(purchase: InAppPurchase, errors: List<ServiceError>) {
                    call.reject(errors.firstOrNull()?.toString() ?: "Validation failed", "VALIDATION_FAILED")
                }
            },
        )
    }

    @PluginMethod
    fun trackEvent(call: PluginCall) {
        val name = call.getString("name")
        if (name.isNullOrEmpty()) {
            call.reject("name is required", ERROR_ARGUMENT)
            return
        }
        val parameters = call.data.optJSONObject("parameters")?.let { Conversions.toMap(it) }
        Appodeal.logEvent(name, parameters)
        call.resolve()
    }

    @PluginMethod
    fun setBidonEndpoint(call: PluginCall) {
        val endpoint = call.getString("endpoint")
        if (endpoint.isNullOrEmpty()) {
            call.reject("endpoint is required", ERROR_ARGUMENT)
            return
        }
        Appodeal.setBidonEndpoint(endpoint)
        call.resolve()
    }

    @PluginMethod
    fun getBidonEndpoint(call: PluginCall) {
        call.resolve(JSObject().put("endpoint", Appodeal.getBidonEndpoint() ?: JSONObject.NULL))
    }

    override fun handleOnDestroy() {
        Appodeal.destroy(Appodeal.BANNER)
        Appodeal.destroy(Appodeal.MREC)
        super.handleOnDestroy()
    }

    companion object {
        const val VERSION = "0.1.0"
        private const val ERROR_ACTIVITY = "ACTIVITY_ERROR"
        private const val ERROR_ARGUMENT = "INVALID_ARGUMENT"
    }
}
