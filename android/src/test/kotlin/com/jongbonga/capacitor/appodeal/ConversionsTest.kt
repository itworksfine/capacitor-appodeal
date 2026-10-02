package com.jongbonga.capacitor.appodeal

import com.appodeal.ads.Appodeal
import com.appodeal.ads.inapp.InAppPurchase
import com.appodeal.ads.utils.Log
import org.junit.Assert.assertEquals
import org.junit.Test

class ConversionsTest {
    @Test
    fun mapsJavaScriptAdTypesToTheSdksAndBack() {
        val interstitialAndRewarded = (1 shl 0) or (1 shl 5)
        assertEquals(
            Appodeal.INTERSTITIAL or Appodeal.REWARDED_VIDEO,
            Conversions.toAppodealTypes(interstitialAndRewarded),
        )
        assertEquals(Appodeal.BANNER_BOTTOM, Conversions.toAppodealTypes(1 shl 3))
        assertEquals(0, Conversions.toAppodealTypes(0))
        for (flag in listOf(1 shl 0, 1 shl 2, 1 shl 3, 1 shl 4, 1 shl 5, 1 shl 8)) {
            assertEquals(flag, Conversions.fromAppodealTypes(Conversions.toAppodealTypes(flag)))
        }
        assertEquals(Conversions.ALL, Conversions.fromAppodealTypes(Conversions.toAppodealTypes(Conversions.ALL)))
    }

    @Test
    fun mapsLogLevelsAndPurchaseTypes() {
        assertEquals(Log.LogLevel.debug, Conversions.logLevel("DEBUG"))
        assertEquals(Log.LogLevel.verbose, Conversions.logLevel("verbose"))
        assertEquals(Log.LogLevel.none, Conversions.logLevel(null))
        assertEquals(InAppPurchase.Type.Subs, Conversions.purchaseType(1))
        assertEquals(InAppPurchase.Type.InApp, Conversions.purchaseType(null))
        assertEquals(1, Conversions.purchaseTypeValue(InAppPurchase.Type.Subs))
    }
}
