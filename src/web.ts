import { WebPlugin } from '@capacitor/core';

import { AppodealConsentStatus, AppodealPrivacyOptionsStatus } from './definitions';
import type { AppodealPlugin, AppodealPurchaseValidationResult, AppodealReward } from './definitions';
import { PLUGIN_VERSION } from './version';

/**
 * Appodeal has no web SDK. Settings are accepted and ignored, lookups answer
 * as if nothing were loaded, consent reads as not required, and calls that
 * would start the SDK or show an ad reject, so an app in the browser takes
 * the same path as one with no fill.
 */
export class AppodealWeb extends WebPlugin implements AppodealPlugin {
  private unsupported(): never {
    throw this.unavailable('Appodeal is not available on web.');
  }

  async initialize(): Promise<void> {
    this.unsupported();
  }

  async isInitialized(): Promise<{ isInitialized: boolean }> {
    return { isInitialized: false };
  }

  async show(): Promise<void> {
    this.unsupported();
  }

  async isLoaded(): Promise<{ isLoaded: boolean }> {
    return { isLoaded: false };
  }

  async canShow(): Promise<{ canShow: boolean }> {
    return { canShow: false };
  }

  async hide(): Promise<void> {
    return;
  }

  async cache(): Promise<void> {
    this.unsupported();
  }

  async setAutoCache(): Promise<void> {
    return;
  }

  async isPrecache(): Promise<{ isPrecache: boolean }> {
    return { isPrecache: false };
  }

  async setTabletBanners(): Promise<void> {
    return;
  }

  async setSmartBanners(): Promise<void> {
    return;
  }

  async setBannerAnimation(): Promise<void> {
    return;
  }

  async setChildDirectedTreatment(): Promise<void> {
    return;
  }

  async consentStatus(): Promise<{ status: AppodealConsentStatus }> {
    return { status: AppodealConsentStatus.UNKNOWN };
  }

  async revokeConsent(): Promise<void> {
    return;
  }

  // There is no consent manager on web, so consent reads as not required and
  // the forms are no-ops: a start-up sequence that asks for consent before
  // initializing runs through in the browser instead of failing at its first
  // step.

  async requestConsentInfoUpdate(): Promise<{ status: AppodealConsentStatus }> {
    return { status: AppodealConsentStatus.NOT_REQUIRED };
  }

  async showConsentFormIfNeeded(): Promise<{ status: AppodealConsentStatus }> {
    return { status: AppodealConsentStatus.NOT_REQUIRED };
  }

  async showConsentForm(): Promise<{ status: AppodealConsentStatus }> {
    return { status: AppodealConsentStatus.NOT_REQUIRED };
  }

  async privacyOptionsRequirementStatus(): Promise<{ status: AppodealPrivacyOptionsStatus }> {
    return { status: AppodealPrivacyOptionsStatus.NOT_REQUIRED };
  }

  async showPrivacyOptionsForm(): Promise<void> {
    return;
  }

  async setNonPersonalized(): Promise<void> {
    return;
  }

  async setTesting(): Promise<void> {
    return;
  }

  async setLogLevel(): Promise<void> {
    return;
  }

  async setTriggerPrecacheCallbacks(): Promise<void> {
    return;
  }

  async disableNetwork(): Promise<void> {
    return;
  }

  async getVersion(): Promise<{ version: string }> {
    return { version: PLUGIN_VERSION };
  }

  async getPlatformSdkVersion(): Promise<{ version: string }> {
    return { version: '' };
  }

  async setUserId(): Promise<void> {
    return;
  }

  async setExtrasValue(): Promise<void> {
    return;
  }

  async setCustomStateValue(): Promise<void> {
    return;
  }

  async getRewardParameters(): Promise<AppodealReward> {
    return { name: '', amount: '0' };
  }

  async predictedEcpm(): Promise<{ ecpm: number }> {
    return { ecpm: 0 };
  }

  async trackInAppPurchase(): Promise<void> {
    return;
  }

  async validateAndTrackInAppPurchase(): Promise<AppodealPurchaseValidationResult> {
    this.unsupported();
  }

  async trackEvent(): Promise<void> {
    return;
  }

  async setBidonEndpoint(): Promise<void> {
    return;
  }

  async getBidonEndpoint(): Promise<{ endpoint: string | null }> {
    return { endpoint: null };
  }
}
