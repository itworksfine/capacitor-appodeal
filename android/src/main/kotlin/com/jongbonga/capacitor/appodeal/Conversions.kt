package com.jongbonga.capacitor.appodeal

import com.appodeal.ads.Appodeal
import com.appodeal.ads.inapp.InAppPurchase
import com.appodeal.ads.utils.Log
import com.appodeal.consent.ConsentStatus
import com.appodeal.consent.PrivacyOptionsRequirementStatus
import org.json.JSONArray
import org.json.JSONObject

/**
 * Converts between the plugin's values, which match `react-native-appodeal`'s,
 * and the SDK's. The bit flags differ: the SDK's own constants are not the
 * ones the JavaScript side uses.
 */
internal object Conversions {
    private const val INTERSTITIAL = 1 shl 0
    private const val BANNER = 1 shl 2
    private const val BANNER_BOTTOM = 1 shl 3
    private const val BANNER_TOP = 1 shl 4
    private const val REWARDED_VIDEO = 1 shl 5
    private const val MREC = 1 shl 8

    /** `AppodealAdType.ALL` on the JavaScript side. */
    const val ALL = INTERSTITIAL or BANNER or BANNER_BOTTOM or BANNER_TOP or REWARDED_VIDEO or MREC

    private fun Int.has(flag: Int) = (this and flag) != 0

    fun toAppodealTypes(types: Int): Int {
        var result = 0
        if (types.has(INTERSTITIAL)) result = result or Appodeal.INTERSTITIAL
        if (types.has(BANNER)) result = result or Appodeal.BANNER
        if (types.has(BANNER_BOTTOM)) result = result or Appodeal.BANNER_BOTTOM
        if (types.has(BANNER_TOP)) result = result or Appodeal.BANNER_TOP
        if (types.has(REWARDED_VIDEO)) result = result or Appodeal.REWARDED_VIDEO
        if (types.has(MREC)) result = result or Appodeal.MREC
        return result
    }

    fun fromAppodealTypes(types: Int): Int {
        var result = 0
        if (types.has(Appodeal.INTERSTITIAL)) result = result or INTERSTITIAL
        if (types.has(Appodeal.BANNER)) result = result or BANNER
        if (types.has(Appodeal.BANNER_BOTTOM)) result = result or BANNER_BOTTOM
        if (types.has(Appodeal.BANNER_TOP)) result = result or BANNER_TOP
        if (types.has(Appodeal.REWARDED_VIDEO)) result = result or REWARDED_VIDEO
        if (types.has(Appodeal.MREC)) result = result or MREC
        return result
    }

    fun consentStatus(status: ConsentStatus): Int = when (status) {
        ConsentStatus.Required -> 1
        ConsentStatus.NotRequired -> 2
        ConsentStatus.Obtained -> 3
        else -> 0
    }

    fun privacyOptionsStatus(status: PrivacyOptionsRequirementStatus): Int = when (status) {
        PrivacyOptionsRequirementStatus.Required -> 1
        PrivacyOptionsRequirementStatus.NotRequired -> 2
        else -> 0
    }

    fun logLevel(value: String?): Log.LogLevel = when (value?.lowercase()) {
        "debug" -> Log.LogLevel.debug
        "verbose" -> Log.LogLevel.verbose
        else -> Log.LogLevel.none
    }

    fun purchaseType(value: Int?): InAppPurchase.Type =
        if (value == 1) InAppPurchase.Type.Subs else InAppPurchase.Type.InApp

    fun purchaseTypeValue(type: InAppPurchase.Type): Int = if (type == InAppPurchase.Type.Subs) 1 else 0

    /** Unwraps JSON from the bridge into the plain values the SDK takes. */
    fun plain(value: Any?): Any? = when (value) {
        null, JSONObject.NULL -> null
        is JSONObject -> toMap(value)
        is JSONArray -> (0 until value.length()).map { plain(value.opt(it)) }
        else -> value
    }

    fun toMap(json: JSONObject): Map<String, Any?> =
        json.keys().asSequence().associateWith { plain(json.opt(it)) }

    fun toStringMap(json: JSONObject): Map<String, String> =
        json.keys().asSequence().associateWith { json.opt(it)?.toString() ?: "" }
}
