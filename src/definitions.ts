import type { PluginListenerHandle } from '@capacitor/core';

/**
 * The Appodeal SDK, mirroring the API of Appodeal's official React Native
 * plugin (`react-native-appodeal`). Method names, ad types, enums and event
 * names are the same; the differences are the ones Capacitor requires:
 * arguments are passed as one options object, and every call returns a
 * promise, so methods that return a value synchronously in React Native
 * resolve with it here.
 */
export interface AppodealPlugin {
  /**
   * Initializes the SDK for the given ad types. Resolves once the call is
   * made; the `onAppodealInitialized` event fires when the SDK is ready.
   *
   * Set testing, logging, consent and other options before calling this.
   *
   * @since 0.1.0
   */
  initialize(options: { appKey: string; adTypes: AppodealAdType }): Promise<void>;

  /**
   * Whether the SDK has been initialized for the given ad types.
   *
   * @since 0.1.0
   */
  isInitialized(options: { adTypes: AppodealAdType }): Promise<{ isInitialized: boolean }>;

  /**
   * Shows an ad. Use `BANNER_BOTTOM` or `BANNER_TOP` for banners, which the
   * SDK lays over the web view. Resolves once the request is made; watch the
   * ad type's events for the outcome.
   *
   * @since 0.1.0
   */
  show(options: { adTypes: AppodealAdType; placement?: string }): Promise<void>;

  /**
   * Whether an ad of the given type is loaded.
   *
   * @since 0.1.0
   */
  isLoaded(options: { adTypes: AppodealAdType }): Promise<{ isLoaded: boolean }>;

  /**
   * Whether an ad of the given type can be shown for the placement, taking
   * the placement's settings in the dashboard (such as frequency caps) into
   * account.
   *
   * @since 0.1.0
   */
  canShow(options: { adTypes: AppodealAdType; placement?: string }): Promise<{ canShow: boolean }>;

  /**
   * Hides the banner.
   *
   * @since 0.1.0
   */
  hide(options: { adTypes: AppodealAdType }): Promise<void>;

  /**
   * Starts loading ads of the given types. Only needed when auto-cache is off.
   *
   * @since 0.1.0
   */
  cache(options: { adTypes: AppodealAdType }): Promise<void>;

  /**
   * Turns automatic loading on or off for the given ad types. On by default.
   * Call before `initialize`.
   *
   * @since 0.1.0
   */
  setAutoCache(options: { adTypes: AppodealAdType; value: boolean }): Promise<void>;

  /**
   * Whether the loaded ad of the given type is a precache (lower-priced) ad.
   *
   * @since 0.1.0
   */
  isPrecache(options: { adTypes: AppodealAdType }): Promise<{ isPrecache: boolean }>;

  /**
   * Use 728×90 banners on tablets.
   *
   * @since 0.1.0
   */
  setTabletBanners(options: { value: boolean }): Promise<void>;

  /**
   * Let banners resize to the screen width.
   *
   * @since 0.1.0
   */
  setSmartBanners(options: { value: boolean }): Promise<void>;

  /**
   * Animate banners when they appear and refresh.
   *
   * @since 0.1.0
   */
  setBannerAnimation(options: { value: boolean }): Promise<void>;

  /**
   * Marks the app as directed at children (COPPA). Call before `initialize`.
   *
   * @since 0.1.0
   */
  setChildDirectedTreatment(options: { value: boolean }): Promise<void>;

  // Consent

  /**
   * The current GDPR consent status.
   *
   * @since 0.1.0
   */
  consentStatus(): Promise<{ status: AppodealConsentStatus }>;

  /**
   * Clears the stored consent, so the form is shown again.
   *
   * @since 0.1.0
   */
  revokeConsent(): Promise<void>;

  /**
   * Fetches whether consent is required for this user. Call before
   * `showConsentFormIfNeeded` and before `initialize`.
   *
   * @since 0.1.0
   */
  requestConsentInfoUpdate(options: { appKey: string }): Promise<{ status: AppodealConsentStatus }>;

  /**
   * Shows the consent form if this user needs to see it.
   *
   * @since 0.1.0
   */
  showConsentFormIfNeeded(): Promise<{ status: AppodealConsentStatus }>;

  /**
   * Shows the consent form.
   *
   * @since 0.1.0
   */
  showConsentForm(): Promise<{ status: AppodealConsentStatus }>;

  /**
   * Whether the app must offer a way back to the privacy options (US state
   * laws, or GDPR re-consent). Known after `requestConsentInfoUpdate`.
   *
   * @since 0.1.0
   */
  privacyOptionsRequirementStatus(): Promise<{ status: AppodealPrivacyOptionsStatus }>;

  /**
   * Shows the privacy options form. Call it from an explicit user action.
   *
   * @since 0.1.0
   */
  showPrivacyOptionsForm(): Promise<void>;

  /**
   * Requests non-personalized ads only.
   *
   * @since 0.1.0
   */
  setNonPersonalized(options: { value: boolean }): Promise<void>;

  // Debugging

  /**
   * Turns on test ads. Call before `initialize`.
   *
   * @since 0.1.0
   */
  setTesting(options: { value: boolean }): Promise<void>;

  /**
   * @since 0.1.0
   */
  setLogLevel(options: { value: AppodealLogLevel }): Promise<void>;

  /**
   * Whether `on*Loaded` events fire for precache ads too.
   *
   * @since 0.1.0
   */
  setTriggerPrecacheCallbacks(options: { adTypes: AppodealAdType; value: boolean }): Promise<void>;

  /**
   * Stops mediating a network, for all ad types or the given ones. Call
   * before `initialize`.
   *
   * @since 0.1.0
   */
  disableNetwork(options: { network: string; adTypes?: AppodealAdType }): Promise<void>;

  /**
   * The plugin's version.
   *
   * @since 0.1.0
   */
  getVersion(): Promise<{ version: string }>;

  /**
   * The version of the native Appodeal SDK.
   *
   * @since 0.1.0
   */
  getPlatformSdkVersion(): Promise<{ version: string }>;

  // Targeting and analytics

  /**
   * @since 0.1.0
   */
  setUserId(options: { id: string }): Promise<void>;

  /**
   * Sets a value passed to mediated networks and server-to-server callbacks.
   * Pass `null` to remove it.
   *
   * @since 0.1.0
   */
  setExtrasValue(options: { key: string; value: AppodealValue }): Promise<void>;

  /**
   * Sets a value for segment and placement targeting rules in the
   * dashboard. Pass `null` to remove it.
   *
   * @since 0.1.0
   */
  setCustomStateValue(options: { key: string; value: AppodealValue }): Promise<void>;

  /**
   * The reward configured for the placement in the dashboard.
   *
   * @since 0.1.0
   */
  getRewardParameters(options?: { placement?: string }): Promise<AppodealReward>;

  /**
   * The expected eCPM of the loaded ad of the given type.
   *
   * @since 0.1.0
   */
  predictedEcpm(options: { adType: AppodealAdType }): Promise<{ ecpm: number }>;

  /**
   * Reports an in-app purchase, for segmenting paying users.
   *
   * @since 0.1.0
   */
  trackInAppPurchase(options: { amount: number; currency: string }): Promise<void>;

  /**
   * Validates an in-app purchase with Appodeal and reports it.
   *
   * @since 0.1.0
   */
  validateAndTrackInAppPurchase(
    purchase: AppodealIOSPurchase | AppodealAndroidPurchase,
  ): Promise<AppodealPurchaseValidationResult>;

  /**
   * Reports an analytics event.
   *
   * @since 0.1.0
   */
  trackEvent(options: { name: string; parameters?: AppodealMap }): Promise<void>;

  /**
   * Points the SDK at a self-hosted Bidon server.
   *
   * @since 0.1.0
   */
  setBidonEndpoint(options: { endpoint: string }): Promise<void>;

  /**
   * @since 0.1.0
   */
  getBidonEndpoint(): Promise<{ endpoint: string | null }>;

  // Events

  /**
   * Events with no data.
   *
   * @since 0.1.0
   */
  addListener(
    eventName:
      | 'onAppodealInitialized'
      | 'onBannerFailedToLoad'
      | 'onBannerExpired'
      | 'onBannerShown'
      | 'onBannerClicked'
      | 'onInterstitialFailedToLoad'
      | 'onInterstitialExpired'
      | 'onInterstitialShown'
      | 'onInterstitialFailedToShow'
      | 'onInterstitialClicked'
      | 'onInterstitialClosed'
      | 'onRewardedVideoFailedToLoad'
      | 'onRewardedVideoExpired'
      | 'onRewardedVideoShown'
      | 'onRewardedVideoFailedToShow'
      | 'onRewardedVideoClicked',
    listenerFunc: () => void,
  ): Promise<PluginListenerHandle>;

  /**
   * @since 0.1.0
   */
  addListener(
    eventName: 'onInterstitialLoaded' | 'onRewardedVideoLoaded',
    listenerFunc: (event: AppodealLoadedEvent) => void,
  ): Promise<PluginListenerHandle>;

  /**
   * Fires when a banner loads. `height` is the banner's height, which the
   * page should keep clear while the banner is shown.
   *
   * @since 0.1.0
   */
  addListener(
    eventName: 'onBannerLoaded',
    listenerFunc: (event: AppodealBannerLoadedEvent) => void,
  ): Promise<PluginListenerHandle>;

  /**
   * Fires when a rewarded video closes. `isFinished` is whether it was
   * watched to the end.
   *
   * @since 0.1.0
   */
  addListener(
    eventName: 'onRewardedVideoClosed',
    listenerFunc: (event: AppodealRewardedVideoClosedEvent) => void,
  ): Promise<PluginListenerHandle>;

  /**
   * Fires when the user earns the reward.
   *
   * @since 0.1.0
   */
  addListener(
    eventName: 'onRewardedVideoFinished',
    listenerFunc: (event: AppodealRewardedVideoFinishedEvent) => void,
  ): Promise<PluginListenerHandle>;

  /**
   * Fires for every paid impression, of any ad type.
   *
   * @since 0.1.0
   */
  addListener(
    eventName: 'onAppodealDidReceiveRevenue',
    listenerFunc: (revenue: AppodealAdRevenue) => void,
  ): Promise<PluginListenerHandle>;

  /**
   * @since 0.1.0
   */
  removeAllListeners(): Promise<void>;
}

/**
 * Ad types as bit flags. Combine them with `|`.
 */
export enum AppodealAdType {
  NONE = 0,
  INTERSTITIAL = 1 << 0,
  BANNER = 1 << 2,
  BANNER_BOTTOM = 1 << 3,
  BANNER_TOP = 1 << 4,
  REWARDED_VIDEO = 1 << 5,
  MREC = 1 << 8,
  ALL = INTERSTITIAL | BANNER | BANNER_BOTTOM | BANNER_TOP | REWARDED_VIDEO | MREC,
}

export enum AppodealLogLevel {
  NONE = 'none',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

export enum AppodealConsentStatus {
  UNKNOWN = 0,
  REQUIRED = 1,
  NOT_REQUIRED = 2,
  OBTAINED = 3,
}

export enum AppodealPrivacyOptionsStatus {
  UNKNOWN = 0,
  REQUIRED = 1,
  NOT_REQUIRED = 2,
}

export enum AppodealIOSPurchaseType {
  CONSUMABLE = 0,
  NON_CONSUMABLE = 1,
  AUTO_RENEWABLE_SUBSCRIPTION = 2,
  NON_RENEWING_SUBSCRIPTION = 3,
}

export enum AppodealAndroidPurchaseType {
  IN_APP = 0,
  SUBSCRIPTION = 1,
}

export type AppodealMap = { [key: string]: any };

export type AppodealValue = string | number | boolean | AppodealMap | null;

export interface AppodealReward {
  /**
   * The reward's currency name.
   *
   * @since 0.1.0
   */
  name: string;

  /**
   * @since 0.1.0
   */
  amount: string;
}

export interface AppodealAdRevenue {
  /**
   * @since 0.1.0
   */
  networkName: string;

  /**
   * @since 0.1.0
   */
  adUnitName: string;

  /**
   * @since 0.1.0
   */
  placement: string;

  /**
   * @since 0.1.0
   */
  revenuePrecision: string;

  /**
   * @since 0.1.0
   */
  demandSource: string;

  /**
   * @since 0.1.0
   */
  currency: string;

  /**
   * @since 0.1.0
   */
  revenue: number;

  /**
   * @since 0.1.0
   */
  adType: AppodealAdType;
}

export interface AppodealLoadedEvent {
  /**
   * @since 0.1.0
   */
  isPrecache: boolean;
}

export interface AppodealBannerLoadedEvent extends AppodealLoadedEvent {
  /**
   * @since 0.1.0
   */
  height: number;
}

export interface AppodealRewardedVideoClosedEvent {
  /**
   * @since 0.1.0
   */
  isFinished: boolean;
}

export interface AppodealRewardedVideoFinishedEvent {
  /**
   * @since 0.1.0
   */
  amount: number;

  /**
   * @since 0.1.0
   */
  currency: string;
}

export interface AppodealIOSPurchase {
  /**
   * @since 0.1.0
   */
  productId: string;

  /**
   * @since 0.1.0
   */
  productType: AppodealIOSPurchaseType;

  /**
   * @since 0.1.0
   */
  price: number;

  /**
   * @since 0.1.0
   */
  currency: string;

  /**
   * @since 0.1.0
   */
  transactionId: string;

  /**
   * @since 0.1.0
   */
  additionalParameters: AppodealMap | null;
}

export interface AppodealAndroidPurchase {
  /**
   * @since 0.1.0
   */
  publicKey: string;

  /**
   * @since 0.1.0
   */
  productType: AppodealAndroidPurchaseType;

  /**
   * @since 0.1.0
   */
  signature: string;

  /**
   * @since 0.1.0
   */
  purchaseData: string;

  /**
   * @since 0.1.0
   */
  purchaseToken: string;

  /**
   * @since 0.1.0
   */
  timestamp: number;

  /**
   * @since 0.1.0
   */
  developerPayload: string;

  /**
   * @since 0.1.0
   */
  price: string;

  /**
   * @since 0.1.0
   */
  currency: string;

  /**
   * @since 0.1.0
   */
  orderId: string;

  /**
   * @since 0.1.0
   */
  sku: string;

  /**
   * @since 0.1.0
   */
  additionalParameters: AppodealMap | null;
}

/**
 * What the validation returns. The fields are filled on Android; on iOS the
 * SDK returns Apple's validation response as is.
 */
export interface AppodealPurchaseValidationResult {
  /**
   * @since 0.1.0
   */
  publicKey?: string;

  /**
   * @since 0.1.0
   */
  signature?: string;

  /**
   * @since 0.1.0
   */
  purchaseData?: string;

  /**
   * @since 0.1.0
   */
  purchaseToken?: string;

  /**
   * @since 0.1.0
   */
  timestamp?: number;

  /**
   * @since 0.1.0
   */
  developerPayload?: string;

  /**
   * @since 0.1.0
   */
  orderId?: string;

  /**
   * @since 0.1.0
   */
  sku?: string;

  /**
   * @since 0.1.0
   */
  price?: string;

  /**
   * @since 0.1.0
   */
  currency?: string;

  /**
   * @since 0.1.0
   */
  productType?: number;

  [key: string]: unknown;
}

/** Event names of the SDK as a whole. */
export const AppodealSdkEvents = {
  INITIALIZED: 'onAppodealInitialized',
  AD_REVENUE: 'onAppodealDidReceiveRevenue',
} as const;

/** Banner event names. */
export const AppodealBannerEvents = {
  LOADED: 'onBannerLoaded',
  FAILED_TO_LOAD: 'onBannerFailedToLoad',
  EXPIRED: 'onBannerExpired',
  SHOWN: 'onBannerShown',
  CLICKED: 'onBannerClicked',
} as const;

/** Interstitial event names. */
export const AppodealInterstitialEvents = {
  LOADED: 'onInterstitialLoaded',
  FAILED_TO_LOAD: 'onInterstitialFailedToLoad',
  EXPIRED: 'onInterstitialExpired',
  SHOWN: 'onInterstitialShown',
  FAILED_TO_SHOW: 'onInterstitialFailedToShow',
  CLICKED: 'onInterstitialClicked',
  CLOSED: 'onInterstitialClosed',
} as const;

/** Rewarded video event names. */
export const AppodealRewardedEvents = {
  LOADED: 'onRewardedVideoLoaded',
  FAILED_TO_LOAD: 'onRewardedVideoFailedToLoad',
  EXPIRED: 'onRewardedVideoExpired',
  SHOWN: 'onRewardedVideoShown',
  FAILED_TO_SHOW: 'onRewardedVideoFailedToShow',
  CLOSED: 'onRewardedVideoClosed',
  REWARD: 'onRewardedVideoFinished',
  CLICKED: 'onRewardedVideoClicked',
} as const;
