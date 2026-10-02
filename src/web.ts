import { WebPlugin } from '@capacitor/core';

import { AppodealConsentStatus, AppodealPrivacyOptionsStatus } from './definitions';
import type { AppodealPlugin, AppodealPurchaseValidationResult, AppodealReward } from './definitions';

/**
 * Appodeal has no web SDK. Settings are accepted and ignored, lookups answer
 * as if nothing were loaded, and calls that would show an ad or a form
 * reject, so an app in the browser takes the same path as one with no fill.
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

  async requestConsentInfoUpdate(): Promise<{ status: AppodealConsentStatus }> {
    this.unsupported();
  }

  async showConsentFormIfNeeded(): Promise<{ status: AppodealConsentStatus }> {
    this.unsupported();
  }

  async showConsentForm(): Promise<{ status: AppodealConsentStatus }> {
    this.unsupported();
  }

  async privacyOptionsRequirementStatus(): Promise<{ status: AppodealPrivacyOptionsStatus }> {
    return { status: AppodealPrivacyOptionsStatus.UNKNOWN };
  }

  async showPrivacyOptionsForm(): Promise<void> {
    this.unsupported();
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

/** Kept in step with `version` in package.json and the native plugins. */
const PLUGIN_VERSION = '0.1.0';
