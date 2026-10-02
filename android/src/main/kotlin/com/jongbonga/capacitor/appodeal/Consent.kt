package com.jongbonga.capacitor.appodeal

import android.app.Activity
import com.appodeal.consent.ConsentForm
import com.appodeal.consent.ConsentInfoUpdateCallback
import com.appodeal.consent.ConsentManager
import com.appodeal.consent.ConsentManagerError
import com.appodeal.consent.ConsentUpdateRequestParameters
import com.appodeal.consent.OnConsentFormDismissedListener
import com.appodeal.consent.OnConsentFormLoadFailureListener
import com.appodeal.consent.OnConsentFormLoadSuccessListener
import com.getcapacitor.JSObject
import com.getcapacitor.PluginCall

/**
 * The consent calls, ported from `react-native-appodeal`'s RNAppodealConsent,
 * with the same rejection codes.
 */
internal object Consent {
    private fun status() = JSObject().put("status", Conversions.consentStatus(ConsentManager.status))

    fun requestInfoUpdate(call: PluginCall, activity: Activity, appKey: String) {
        ConsentManager.requestConsentInfoUpdate(
            parameters = ConsentUpdateRequestParameters(activity, appKey),
            callback = object : ConsentInfoUpdateCallback {
                override fun onUpdated() = call.resolve(status())

                override fun onFailed(error: ConsentManagerError) =
                    call.reject(error.localizedMessage, "APD_REQUEST_CONSENT_INFO_UPDATE_ERROR")
            },
        )
    }

    fun showFormIfNeeded(call: PluginCall, activity: Activity) {
        ConsentManager.loadAndShowConsentFormIfRequired(
            activity = activity,
            dismissedListener = object : OnConsentFormDismissedListener {
                override fun onConsentFormDismissed(error: ConsentManagerError?) {
                    if (error != null) {
                        call.reject(error.localizedMessage, "APD_SHOW_CONSENT_FORM_IF_NEEDED_ERROR")
                    } else {
                        call.resolve(status())
                    }
                }
            },
        )
    }

    fun showForm(call: PluginCall, activity: Activity) {
        ConsentManager.load(
            context = activity,
            successListener = object : OnConsentFormLoadSuccessListener {
                override fun onConsentFormLoadSuccess(consentForm: ConsentForm) {
                    consentForm.show(
                        activity,
                        object : OnConsentFormDismissedListener {
                            override fun onConsentFormDismissed(error: ConsentManagerError?) {
                                if (error != null) {
                                    call.reject(error.localizedMessage, "APD_SHOW_CONSENT_FORM_ERROR")
                                } else {
                                    call.resolve(status())
                                }
                            }
                        },
                    )
                }
            },
            failureListener = object : OnConsentFormLoadFailureListener {
                override fun onConsentFormLoadFailure(error: ConsentManagerError) =
                    call.reject(error.localizedMessage, "APD_SHOW_CONSENT_FORM_ERROR")
            },
        )
    }

    fun showPrivacyOptionsForm(call: PluginCall, activity: Activity) {
        ConsentManager.showPrivacyOptionsForm(
            activity = activity,
            listener = object : OnConsentFormDismissedListener {
                override fun onConsentFormDismissed(error: ConsentManagerError?) {
                    if (error != null) {
                        call.reject(error.localizedMessage, "APD_SHOW_PRIVACY_OPTIONS_FORM_ERROR")
                    } else {
                        call.resolve()
                    }
                }
            },
        )
    }
}
