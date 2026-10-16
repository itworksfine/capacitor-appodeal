# @itworksfine/capacitor-appodeal

[![npm](https://img.shields.io/npm/v/@itworksfine/capacitor-appodeal)](https://www.npmjs.com/package/@itworksfine/capacitor-appodeal)
[![license](https://img.shields.io/npm/l/@itworksfine/capacitor-appodeal)](LICENSE)

Capacitor plugin for [Appodeal](https://appodeal.com): interstitial, rewarded video and banner ads, with Appodeal mediation, on Android and iOS.

The API mirrors Appodeal's official React Native plugin, [`react-native-appodeal`](https://github.com/appodeal/react-native-appodeal), so Appodeal's documentation and examples carry over. See [Differences from react-native-appodeal](#differences-from-react-native-appodeal).

> **Status: 0.1, experimental.** The Android side builds against Appodeal SDK 4.4.0. Test on real devices before you ship.

## Requirements

- Capacitor 8
- iOS 15+ (Swift Package Manager or CocoaPods), built with Xcode 26 or later: Appodeal's frameworks do not link with older toolchains
- Android API 24+
- An Appodeal account and app key

## Install

```bash
npm install @itworksfine/capacitor-appodeal
npx cap sync
```

The plugin brings in the Appodeal SDK 4.4 and its IAB adapter, which serves Appodeal's own exchange demand, as `react-native-appodeal` does. To pin other versions on Android, set `appodealSdkVersion` and `appodealIabAdapterVersion` in `android/variables.gradle`.

## Setup

### iOS

Add these to `ios/App/App/Info.plist`:

- `GADApplicationIdentifier`, if you mediate Google AdMob.
- `NSUserTrackingUsageDescription`, the text of the App Tracking Transparency prompt.
- `SKAdNetworkItems`, Appodeal's list of SKAdNetwork IDs for the networks you use. Get it from the [Appodeal iOS docs](https://docs.appodeal.com/ios/get-started).

In Xcode, add `-ObjC` to **Other Linker Flags** on the App target. Appodeal adds methods through Objective-C categories that the linker otherwise strips, and `initialize` then crashes with `unrecognized selector … buildEnvironmentStore:`. CocoaPods sets this for you; with Swift Package Manager the plugin passes it from `node_modules`, but set it on the target anyway in case the package is resolved another way.

### Android

The plugin adds Appodeal's Maven repository itself. If your app declares repositories in `settings.gradle` with `RepositoriesMode.FAIL_ON_PROJECT_REPOS`, add `maven { url 'https://artifactory.appodeal.com/appodeal' }` there too.

Some networks serve ads over plain HTTP. If yours do, set a [network security config](https://docs.appodeal.com/android/get-started) that allows cleartext traffic, as Appodeal's Android guide describes. The plugin does not set one, so it never overrides your app's.

### Mediated networks

The IAB adapter is included. Add the adapter for each other network you enable in the dashboard; Appodeal's [Configure Mediated Networks](https://docs.appodeal.com/ios/advanced/configure-mediated-networks) page lists them:

- **Android:** in `android/app/build.gradle`, for example `implementation 'com.appodeal.ads.sdk.networks:admob:…'`.
- **iOS (Swift Package Manager):** add the network's `Appodeal-Swift-Package-…` package to the app target in Xcode.
- **iOS (CocoaPods):** add the network's pod to `ios/App/Podfile`.

Also publish an [`app-ads.txt`](https://docs.appodeal.com/advanced/app-ads-txt) on your developer website.

## Usage

```ts
import { Appodeal, AppodealAdType, AppodealConsentStatus } from '@itworksfine/capacitor-appodeal';

const APP_KEY = 'YOUR_APP_KEY';
const AD_TYPES = AppodealAdType.INTERSTITIAL | AppodealAdType.REWARDED_VIDEO | AppodealAdType.BANNER;

// Consent first, then initialize.
await Appodeal.requestConsentInfoUpdate({ appKey: APP_KEY });
await Appodeal.showConsentFormIfNeeded();

Appodeal.addListener('onAppodealInitialized', () => console.log('Appodeal ready'));
await Appodeal.setTesting({ value: true }); // test ads while developing
await Appodeal.initialize({ appKey: APP_KEY, adTypes: AD_TYPES });

// Interstitial
if ((await Appodeal.canShow({ adTypes: AppodealAdType.INTERSTITIAL })).canShow) {
  await Appodeal.show({ adTypes: AppodealAdType.INTERSTITIAL });
}
Appodeal.addListener('onInterstitialClosed', () => resumeGame());

// Rewarded video
Appodeal.addListener('onRewardedVideoFinished', ({ amount, currency }) => grant(amount, currency));
await Appodeal.show({ adTypes: AppodealAdType.REWARDED_VIDEO, placement: 'review' });

// Banner
Appodeal.addListener('onBannerLoaded', ({ height }) => {
  document.body.style.setProperty('--banner-height', `${height}px`);
});
await Appodeal.show({ adTypes: AppodealAdType.BANNER_BOTTOM });
await Appodeal.hide({ adTypes: AppodealAdType.BANNER });
```

### Banners and the web view

The SDK lays banners over the web view, inside the safe area. The page has to keep its own content clear of them: `onBannerLoaded` reports the banner's `height`, so reserve `calc(var(--banner-height) + env(safe-area-inset-bottom))` for a bottom banner while it is shown. The last `onBannerLoaded` is kept until the page adds a listener, so a banner that loads before the page is ready is not missed.

There is one banner, so `isLoaded` and `hide` answer and act the same for `BANNER`, `BANNER_BOTTOM` and `BANNER_TOP`; `show` with plain `BANNER` shows it at the bottom. On Android a banner that fails to show fires `onBannerFailedToShow`; the iOS SDK does not report that case.

### Waiting for the SDK

`initialize` resolves as soon as the call is made, as in `react-native-appodeal`. To wait until the SDK is ready instead, pass `waitForInitialization: true`; the call then resolves on `onAppodealInitialized` and rejects with `INITIALIZATION_TIMEOUT` after `initializationTimeoutMs` (30 seconds by default).

```ts
await Appodeal.initialize({ appKey: APP_KEY, adTypes: AD_TYPES, waitForInitialization: true });
```

## Differences from react-native-appodeal

| react-native-appodeal | This plugin | Why |
| --- | --- | --- |
| `Appodeal.initialize(appKey, adTypes)` | `Appodeal.initialize({ appKey, adTypes })` | Capacitor methods take one options object |
| `Appodeal.isLoaded(adTypes)` returns `boolean` | resolves `{ isLoaded }` | Capacitor calls can't return synchronously; the same holds for every getter |
| `Appodeal.addEventListener(event, handler)` | `Appodeal.addListener(event, handler)` | Capacitor's listener API; the event names are the same |
| `<AppodealBanner>`, `<AppodealMrec>` components | not available | Use `show({ adTypes: BANNER_BOTTOM })` for banners. MRECs are not supported yet |
| `getVersion()` | resolves this plugin's version | |
| `initialize` | takes `waitForInitialization` and `initializationTimeoutMs` | Optional; see [Waiting for the SDK](#waiting-for-the-sdk) |
| `onAppodealInitialized` has no payload | carries `{ errors }` | Android's per-network initialization errors; empty on iOS |
| `onRewardedVideoFailedToShow` has no payload | carries `{ message }` on iOS | The iOS SDK gives the reason; Android's does not |
| `onBannerFailedToShow` is dropped | fires on Android | The iOS SDK has no such callback |
| Consent calls on web | resolve as not required | `react-native-appodeal` has no web target; here a consent-first start-up runs through in the browser |

Everything else (`AppodealAdType` flags, the consent and purchase enums, event names and their payloads, rejection codes) matches.

## Known issues

Reported against `react-native-appodeal`, reviewed for whether they reach this plugin. Most come from the native SDK or from a mediated network, so they can affect any wrapper.

**Handled in this plugin**

- **Crash on Android when returning from a full-screen ad to a screen with a banner** ([#105](https://github.com/appodeal/react-native-appodeal/issues/105)): "The specified child already has a parent". The plugin keeps `setSharedAdsInstanceAcrossActivities(true)`, as `react-native-appodeal` does.
- **Crash on Android at startup with a null context** ([#118](https://github.com/appodeal/react-native-appodeal/issues/118)): `initialize` falls back to the application context when there is no activity yet.
- **iOS banners drawn off-centre** ([#153](https://github.com/appodeal/react-native-appodeal/issues/153), [#186](https://github.com/appodeal/react-native-appodeal/issues/186)): caused by the React Native banner component's own layout code, which this plugin does not have. Banners here are placed by the SDK; still check them on a real device.

**Flagged: depend on what you add to the app**

- **Android crash at launch: "The Google Mobile Ads SDK was initialized incorrectly"** ([#154](https://github.com/appodeal/react-native-appodeal/issues/154)). The plugin pulls in no Google Mobile Ads library, but the AdMob adapter, and other adapters that bundle Google's SDK, do. With any of them in the app, set the AdMob app ID in `AndroidManifest.xml` (`com.google.android.gms.ads.APPLICATION_ID`) and in `Info.plist` (`GADApplicationIdentifier`), even if you do not mediate AdMob.
- **Android crash: "Using WebView from more than one process at once with the same data directory"** ([#104](https://github.com/appodeal/react-native-appodeal/issues/104)). Some network SDKs run a second process. The plugin's own dependencies start none, but if an adapter you add does, don't touch `WebView` from your `Application` class in that process (for example, a `WebView.setWebContentsDebuggingEnabled` call), or give each process its own data directory with `WebView.setDataDirectorySuffix`.

**Flagged: in the native SDK, nothing a wrapper can fix**

- **iOS `EXC_BAD_ACCESS` in `SKAdNetwork startImpression`** ([#161](https://github.com/appodeal/react-native-appodeal/issues/161), [#162](https://github.com/appodeal/react-native-appodeal/issues/162)): reported on SDK 3.10 after interstitials, linked to the BidMachine adapter. Unconfirmed on 4.x. Watch crash reports after release, and check with Appodeal support if it shows up.
- **Ads load in test mode but not in production** ([#164](https://github.com/appodeal/react-native-appodeal/issues/164)): usually set-up rather than code. Before release, check that the app is linked to its store listing in the dashboard, that `app-ads.txt` is published, and that test mode is off.
- **Dashboard says "CMP not integrated yet" though consent works** ([#159](https://github.com/appodeal/react-native-appodeal/issues/159)): reporting on Appodeal's side; consent still reaches the SDK.
- **Server-to-server reward callbacks not arriving on iOS** ([#136](https://github.com/appodeal/react-native-appodeal/issues/136)): unresolved upstream. Don't rely on them for anything critical without testing on iOS.

**Build**

- Android dependencies come from Appodeal's Artifactory, which has been slow or briefly unavailable ([#135](https://github.com/appodeal/react-native-appodeal/issues/135), [#101](https://github.com/appodeal/react-native-appodeal/issues/101)). Cache Gradle in CI.

## API

<docgen-index>

* [`initialize(...)`](#initialize)
* [`isInitialized(...)`](#isinitialized)
* [`show(...)`](#show)
* [`isLoaded(...)`](#isloaded)
* [`canShow(...)`](#canshow)
* [`hide(...)`](#hide)
* [`cache(...)`](#cache)
* [`setAutoCache(...)`](#setautocache)
* [`isPrecache(...)`](#isprecache)
* [`setTabletBanners(...)`](#settabletbanners)
* [`setSmartBanners(...)`](#setsmartbanners)
* [`setBannerAnimation(...)`](#setbanneranimation)
* [`setChildDirectedTreatment(...)`](#setchilddirectedtreatment)
* [`consentStatus()`](#consentstatus)
* [`revokeConsent()`](#revokeconsent)
* [`requestConsentInfoUpdate(...)`](#requestconsentinfoupdate)
* [`showConsentFormIfNeeded()`](#showconsentformifneeded)
* [`showConsentForm()`](#showconsentform)
* [`privacyOptionsRequirementStatus()`](#privacyoptionsrequirementstatus)
* [`showPrivacyOptionsForm()`](#showprivacyoptionsform)
* [`setNonPersonalized(...)`](#setnonpersonalized)
* [`setTesting(...)`](#settesting)
* [`setLogLevel(...)`](#setloglevel)
* [`setTriggerPrecacheCallbacks(...)`](#settriggerprecachecallbacks)
* [`disableNetwork(...)`](#disablenetwork)
* [`getVersion()`](#getversion)
* [`getPlatformSdkVersion()`](#getplatformsdkversion)
* [`setUserId(...)`](#setuserid)
* [`setExtrasValue(...)`](#setextrasvalue)
* [`setCustomStateValue(...)`](#setcustomstatevalue)
* [`getRewardParameters(...)`](#getrewardparameters)
* [`predictedEcpm(...)`](#predictedecpm)
* [`trackInAppPurchase(...)`](#trackinapppurchase)
* [`validateAndTrackInAppPurchase(...)`](#validateandtrackinapppurchase)
* [`trackEvent(...)`](#trackevent)
* [`setBidonEndpoint(...)`](#setbidonendpoint)
* [`getBidonEndpoint()`](#getbidonendpoint)
* [`addListener('onAppodealInitialized' | 'onBannerFailedToLoad' | 'onBannerExpired' | 'onBannerShown' | 'onBannerClicked' | 'onInterstitialFailedToLoad' | 'onInterstitialExpired' | 'onInterstitialShown' | 'onInterstitialFailedToShow' | 'onInterstitialClicked' | 'onInterstitialClosed' | 'onRewardedVideoFailedToLoad' | 'onRewardedVideoExpired' | 'onRewardedVideoShown' | 'onRewardedVideoClicked', ...)`](#addlisteneronappodealinitialized--onbannerfailedtoload--onbannerexpired--onbannershown--onbannerclicked--oninterstitialfailedtoload--oninterstitialexpired--oninterstitialshown--oninterstitialfailedtoshow--oninterstitialclicked--oninterstitialclosed--onrewardedvideofailedtoload--onrewardedvideoexpired--onrewardedvideoshown--onrewardedvideoclicked-)
* [`addListener('onAppodealInitialized', ...)`](#addlisteneronappodealinitialized-)
* [`addListener('onBannerFailedToShow' | 'onRewardedVideoFailedToShow', ...)`](#addlisteneronbannerfailedtoshow--onrewardedvideofailedtoshow-)
* [`addListener('onInterstitialLoaded' | 'onRewardedVideoLoaded', ...)`](#addlisteneroninterstitialloaded--onrewardedvideoloaded-)
* [`addListener('onBannerLoaded', ...)`](#addlisteneronbannerloaded-)
* [`addListener('onRewardedVideoClosed', ...)`](#addlisteneronrewardedvideoclosed-)
* [`addListener('onRewardedVideoFinished', ...)`](#addlisteneronrewardedvideofinished-)
* [`addListener('onAppodealDidReceiveRevenue', ...)`](#addlisteneronappodealdidreceiverevenue-)
* [`removeAllListeners()`](#removealllisteners)
* [Interfaces](#interfaces)
* [Type Aliases](#type-aliases)
* [Enums](#enums)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

The Appodeal SDK, mirroring the API of Appodeal's official React Native
plugin (`react-native-appodeal`). Method names, ad types, enums and event
names are the same; the differences are the ones Capacitor requires:
arguments are passed as one options object, and every call returns a
promise, so methods that return a value synchronously in React Native
resolve with it here.

### initialize(...)

```typescript
initialize(options: { appKey: string; adTypes: AppodealAdType; waitForInitialization?: boolean; initializationTimeoutMs?: number; }) => Promise<void>
```

Initializes the SDK for the given ad types. By default it resolves once
the call is made, and the `onAppodealInitialized` event fires when the
SDK is ready. With `waitForInitialization` it resolves when the SDK is
ready instead, and rejects with `INITIALIZATION_TIMEOUT` if that takes
longer than `initializationTimeoutMs` (30 seconds by default); the SDK
carries on initializing in the background either way.

Set testing, logging, consent and other options before calling this.

| Param         | Type                                                                                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`options`** | <code>{ appKey: string; adTypes: <a href="#appodealadtype">AppodealAdType</a>; waitForInitialization?: boolean; initializationTimeoutMs?: number; }</code> |

**Since:** 0.1.0

--------------------


### isInitialized(...)

```typescript
isInitialized(options: { adTypes: AppodealAdType; }) => Promise<{ isInitialized: boolean; }>
```

Whether the SDK has been initialized for the given ad types.

| Param         | Type                                                                    |
| ------------- | ----------------------------------------------------------------------- |
| **`options`** | <code>{ adTypes: <a href="#appodealadtype">AppodealAdType</a>; }</code> |

**Returns:** <code>Promise&lt;{ isInitialized: boolean; }&gt;</code>

**Since:** 0.1.0

--------------------


### show(...)

```typescript
show(options: { adTypes: AppodealAdType; placement?: string; }) => Promise<void>
```

Shows an ad. Use `BANNER_BOTTOM` or `BANNER_TOP` for banners, which the
SDK lays over the web view; plain `BANNER` shows at the bottom. Resolves
once the request is made; watch the ad type's events for the outcome.

| Param         | Type                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------- |
| **`options`** | <code>{ adTypes: <a href="#appodealadtype">AppodealAdType</a>; placement?: string; }</code> |

**Since:** 0.1.0

--------------------


### isLoaded(...)

```typescript
isLoaded(options: { adTypes: AppodealAdType; }) => Promise<{ isLoaded: boolean; }>
```

Whether an ad of the given type is loaded. For banners, `BANNER`,
`BANNER_BOTTOM` and `BANNER_TOP` all answer for the one banner the SDK
loads.

| Param         | Type                                                                    |
| ------------- | ----------------------------------------------------------------------- |
| **`options`** | <code>{ adTypes: <a href="#appodealadtype">AppodealAdType</a>; }</code> |

**Returns:** <code>Promise&lt;{ isLoaded: boolean; }&gt;</code>

**Since:** 0.1.0

--------------------


### canShow(...)

```typescript
canShow(options: { adTypes: AppodealAdType; placement?: string; }) => Promise<{ canShow: boolean; }>
```

Whether an ad of the given type can be shown for the placement, taking
the placement's settings in the dashboard (such as frequency caps) into
account.

| Param         | Type                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------- |
| **`options`** | <code>{ adTypes: <a href="#appodealadtype">AppodealAdType</a>; placement?: string; }</code> |

**Returns:** <code>Promise&lt;{ canShow: boolean; }&gt;</code>

**Since:** 0.1.0

--------------------


### hide(...)

```typescript
hide(options: { adTypes: AppodealAdType; }) => Promise<void>
```

Hides the banner. Any of `BANNER`, `BANNER_BOTTOM` and `BANNER_TOP`
hides it, on both platforms.

| Param         | Type                                                                    |
| ------------- | ----------------------------------------------------------------------- |
| **`options`** | <code>{ adTypes: <a href="#appodealadtype">AppodealAdType</a>; }</code> |

**Since:** 0.1.0

--------------------


### cache(...)

```typescript
cache(options: { adTypes: AppodealAdType; }) => Promise<void>
```

Starts loading ads of the given types. Only needed when auto-cache is off.

| Param         | Type                                                                    |
| ------------- | ----------------------------------------------------------------------- |
| **`options`** | <code>{ adTypes: <a href="#appodealadtype">AppodealAdType</a>; }</code> |

**Since:** 0.1.0

--------------------


### setAutoCache(...)

```typescript
setAutoCache(options: { adTypes: AppodealAdType; value: boolean; }) => Promise<void>
```

Turns automatic loading on or off for the given ad types. On by default.
Call before `initialize`.

| Param         | Type                                                                                    |
| ------------- | --------------------------------------------------------------------------------------- |
| **`options`** | <code>{ adTypes: <a href="#appodealadtype">AppodealAdType</a>; value: boolean; }</code> |

**Since:** 0.1.0

--------------------


### isPrecache(...)

```typescript
isPrecache(options: { adTypes: AppodealAdType; }) => Promise<{ isPrecache: boolean; }>
```

Whether the loaded ad of the given type is a precache (lower-priced) ad.

| Param         | Type                                                                    |
| ------------- | ----------------------------------------------------------------------- |
| **`options`** | <code>{ adTypes: <a href="#appodealadtype">AppodealAdType</a>; }</code> |

**Returns:** <code>Promise&lt;{ isPrecache: boolean; }&gt;</code>

**Since:** 0.1.0

--------------------


### setTabletBanners(...)

```typescript
setTabletBanners(options: { value: boolean; }) => Promise<void>
```

Use 728×90 banners on tablets.

| Param         | Type                             |
| ------------- | -------------------------------- |
| **`options`** | <code>{ value: boolean; }</code> |

**Since:** 0.1.0

--------------------


### setSmartBanners(...)

```typescript
setSmartBanners(options: { value: boolean; }) => Promise<void>
```

Let banners resize to the screen width.

| Param         | Type                             |
| ------------- | -------------------------------- |
| **`options`** | <code>{ value: boolean; }</code> |

**Since:** 0.1.0

--------------------


### setBannerAnimation(...)

```typescript
setBannerAnimation(options: { value: boolean; }) => Promise<void>
```

Animate banners when they appear and refresh.

| Param         | Type                             |
| ------------- | -------------------------------- |
| **`options`** | <code>{ value: boolean; }</code> |

**Since:** 0.1.0

--------------------


### setChildDirectedTreatment(...)

```typescript
setChildDirectedTreatment(options: { value: boolean; }) => Promise<void>
```

Marks the app as directed at children (COPPA). Call before `initialize`.

| Param         | Type                             |
| ------------- | -------------------------------- |
| **`options`** | <code>{ value: boolean; }</code> |

**Since:** 0.1.0

--------------------


### consentStatus()

```typescript
consentStatus() => Promise<{ status: AppodealConsentStatus; }>
```

The current GDPR consent status.

**Returns:** <code>Promise&lt;{ status: <a href="#appodealconsentstatus">AppodealConsentStatus</a>; }&gt;</code>

**Since:** 0.1.0

--------------------


### revokeConsent()

```typescript
revokeConsent() => Promise<void>
```

Clears the stored consent, so the form is shown again.

**Since:** 0.1.0

--------------------


### requestConsentInfoUpdate(...)

```typescript
requestConsentInfoUpdate(options: { appKey: string; }) => Promise<{ status: AppodealConsentStatus; }>
```

Fetches whether consent is required for this user. Call before
`showConsentFormIfNeeded` and before `initialize`.

| Param         | Type                             |
| ------------- | -------------------------------- |
| **`options`** | <code>{ appKey: string; }</code> |

**Returns:** <code>Promise&lt;{ status: <a href="#appodealconsentstatus">AppodealConsentStatus</a>; }&gt;</code>

**Since:** 0.1.0

--------------------


### showConsentFormIfNeeded()

```typescript
showConsentFormIfNeeded() => Promise<{ status: AppodealConsentStatus; }>
```

Shows the consent form if this user needs to see it.

**Returns:** <code>Promise&lt;{ status: <a href="#appodealconsentstatus">AppodealConsentStatus</a>; }&gt;</code>

**Since:** 0.1.0

--------------------


### showConsentForm()

```typescript
showConsentForm() => Promise<{ status: AppodealConsentStatus; }>
```

Shows the consent form.

**Returns:** <code>Promise&lt;{ status: <a href="#appodealconsentstatus">AppodealConsentStatus</a>; }&gt;</code>

**Since:** 0.1.0

--------------------


### privacyOptionsRequirementStatus()

```typescript
privacyOptionsRequirementStatus() => Promise<{ status: AppodealPrivacyOptionsStatus; }>
```

Whether the app must offer a way back to the privacy options (US state
laws, or GDPR re-consent). Known after `requestConsentInfoUpdate`.

**Returns:** <code>Promise&lt;{ status: <a href="#appodealprivacyoptionsstatus">AppodealPrivacyOptionsStatus</a>; }&gt;</code>

**Since:** 0.1.0

--------------------


### showPrivacyOptionsForm()

```typescript
showPrivacyOptionsForm() => Promise<void>
```

Shows the privacy options form. Call it from an explicit user action.

**Since:** 0.1.0

--------------------


### setNonPersonalized(...)

```typescript
setNonPersonalized(options: { value: boolean; }) => Promise<void>
```

Requests non-personalized ads only.

| Param         | Type                             |
| ------------- | -------------------------------- |
| **`options`** | <code>{ value: boolean; }</code> |

**Since:** 0.1.0

--------------------


### setTesting(...)

```typescript
setTesting(options: { value: boolean; }) => Promise<void>
```

Turns on test ads. Call before `initialize`.

| Param         | Type                             |
| ------------- | -------------------------------- |
| **`options`** | <code>{ value: boolean; }</code> |

**Since:** 0.1.0

--------------------


### setLogLevel(...)

```typescript
setLogLevel(options: { value: AppodealLogLevel; }) => Promise<void>
```

| Param         | Type                                                                      |
| ------------- | ------------------------------------------------------------------------- |
| **`options`** | <code>{ value: <a href="#appodealloglevel">AppodealLogLevel</a>; }</code> |

**Since:** 0.1.0

--------------------


### setTriggerPrecacheCallbacks(...)

```typescript
setTriggerPrecacheCallbacks(options: { adTypes: AppodealAdType; value: boolean; }) => Promise<void>
```

Whether `on*Loaded` events fire for precache ads too.

| Param         | Type                                                                                    |
| ------------- | --------------------------------------------------------------------------------------- |
| **`options`** | <code>{ adTypes: <a href="#appodealadtype">AppodealAdType</a>; value: boolean; }</code> |

**Since:** 0.1.0

--------------------


### disableNetwork(...)

```typescript
disableNetwork(options: { network: string; adTypes?: AppodealAdType; }) => Promise<void>
```

Stops mediating a network, for all ad types or the given ones. Call
before `initialize`.

| Param         | Type                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------- |
| **`options`** | <code>{ network: string; adTypes?: <a href="#appodealadtype">AppodealAdType</a>; }</code> |

**Since:** 0.1.0

--------------------


### getVersion()

```typescript
getVersion() => Promise<{ version: string; }>
```

The plugin's version.

**Returns:** <code>Promise&lt;{ version: string; }&gt;</code>

**Since:** 0.1.0

--------------------


### getPlatformSdkVersion()

```typescript
getPlatformSdkVersion() => Promise<{ version: string; }>
```

The version of the native Appodeal SDK.

**Returns:** <code>Promise&lt;{ version: string; }&gt;</code>

**Since:** 0.1.0

--------------------


### setUserId(...)

```typescript
setUserId(options: { id: string; }) => Promise<void>
```

| Param         | Type                         |
| ------------- | ---------------------------- |
| **`options`** | <code>{ id: string; }</code> |

**Since:** 0.1.0

--------------------


### setExtrasValue(...)

```typescript
setExtrasValue(options: { key: string; value: AppodealValue; }) => Promise<void>
```

Sets a value passed to mediated networks and server-to-server callbacks.
Pass `null` to remove it.

| Param         | Type                                                                             |
| ------------- | -------------------------------------------------------------------------------- |
| **`options`** | <code>{ key: string; value: <a href="#appodealvalue">AppodealValue</a>; }</code> |

**Since:** 0.1.0

--------------------


### setCustomStateValue(...)

```typescript
setCustomStateValue(options: { key: string; value: AppodealValue; }) => Promise<void>
```

Sets a value for segment and placement targeting rules in the
dashboard. Pass `null` to remove it.

| Param         | Type                                                                             |
| ------------- | -------------------------------------------------------------------------------- |
| **`options`** | <code>{ key: string; value: <a href="#appodealvalue">AppodealValue</a>; }</code> |

**Since:** 0.1.0

--------------------


### getRewardParameters(...)

```typescript
getRewardParameters(options?: { placement?: string | undefined; } | undefined) => Promise<AppodealReward>
```

The reward configured for the placement in the dashboard.

| Param         | Type                                 |
| ------------- | ------------------------------------ |
| **`options`** | <code>{ placement?: string; }</code> |

**Returns:** <code>Promise&lt;<a href="#appodealreward">AppodealReward</a>&gt;</code>

**Since:** 0.1.0

--------------------


### predictedEcpm(...)

```typescript
predictedEcpm(options: { adType: AppodealAdType; }) => Promise<{ ecpm: number; }>
```

The expected eCPM of the loaded ad of the given type.

| Param         | Type                                                                   |
| ------------- | ---------------------------------------------------------------------- |
| **`options`** | <code>{ adType: <a href="#appodealadtype">AppodealAdType</a>; }</code> |

**Returns:** <code>Promise&lt;{ ecpm: number; }&gt;</code>

**Since:** 0.1.0

--------------------


### trackInAppPurchase(...)

```typescript
trackInAppPurchase(options: { amount: number; currency: string; }) => Promise<void>
```

Reports an in-app purchase, for segmenting paying users.

| Param         | Type                                               |
| ------------- | -------------------------------------------------- |
| **`options`** | <code>{ amount: number; currency: string; }</code> |

**Since:** 0.1.0

--------------------


### validateAndTrackInAppPurchase(...)

```typescript
validateAndTrackInAppPurchase(purchase: AppodealIOSPurchase | AppodealAndroidPurchase) => Promise<AppodealPurchaseValidationResult>
```

Validates an in-app purchase with Appodeal and reports it.

| Param          | Type                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **`purchase`** | <code><a href="#appodealiospurchase">AppodealIOSPurchase</a> \| <a href="#appodealandroidpurchase">AppodealAndroidPurchase</a></code> |

**Returns:** <code>Promise&lt;<a href="#appodealpurchasevalidationresult">AppodealPurchaseValidationResult</a>&gt;</code>

**Since:** 0.1.0

--------------------


### trackEvent(...)

```typescript
trackEvent(options: { name: string; parameters?: AppodealMap; }) => Promise<void>
```

Reports an analytics event.

| Param         | Type                                                                                |
| ------------- | ----------------------------------------------------------------------------------- |
| **`options`** | <code>{ name: string; parameters?: <a href="#appodealmap">AppodealMap</a>; }</code> |

**Since:** 0.1.0

--------------------


### setBidonEndpoint(...)

```typescript
setBidonEndpoint(options: { endpoint: string; }) => Promise<void>
```

Points the SDK at a self-hosted Bidon server.

| Param         | Type                               |
| ------------- | ---------------------------------- |
| **`options`** | <code>{ endpoint: string; }</code> |

**Since:** 0.1.0

--------------------


### getBidonEndpoint()

```typescript
getBidonEndpoint() => Promise<{ endpoint: string | null; }>
```

**Returns:** <code>Promise&lt;{ endpoint: string | null; }&gt;</code>

**Since:** 0.1.0

--------------------


### addListener('onAppodealInitialized' | 'onBannerFailedToLoad' | 'onBannerExpired' | 'onBannerShown' | 'onBannerClicked' | 'onInterstitialFailedToLoad' | 'onInterstitialExpired' | 'onInterstitialShown' | 'onInterstitialFailedToShow' | 'onInterstitialClicked' | 'onInterstitialClosed' | 'onRewardedVideoFailedToLoad' | 'onRewardedVideoExpired' | 'onRewardedVideoShown' | 'onRewardedVideoClicked', ...)

```typescript
addListener(eventName: 'onAppodealInitialized' | 'onBannerFailedToLoad' | 'onBannerExpired' | 'onBannerShown' | 'onBannerClicked' | 'onInterstitialFailedToLoad' | 'onInterstitialExpired' | 'onInterstitialShown' | 'onInterstitialFailedToShow' | 'onInterstitialClicked' | 'onInterstitialClosed' | 'onRewardedVideoFailedToLoad' | 'onRewardedVideoExpired' | 'onRewardedVideoShown' | 'onRewardedVideoClicked', listenerFunc: () => void) => Promise<PluginListenerHandle>
```

Events with no data.

| Param              | Type                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`eventName`**    | <code>'onAppodealInitialized' \| 'onBannerFailedToLoad' \| 'onBannerExpired' \| 'onBannerShown' \| 'onBannerClicked' \| 'onInterstitialFailedToLoad' \| 'onInterstitialExpired' \| 'onInterstitialShown' \| 'onInterstitialFailedToShow' \| 'onInterstitialClicked' \| 'onInterstitialClosed' \| 'onRewardedVideoFailedToLoad' \| 'onRewardedVideoExpired' \| 'onRewardedVideoShown' \| 'onRewardedVideoClicked'</code> |
| **`listenerFunc`** | <code>() =&gt; void</code>                                                                                                                                                                                                                                                                                                                                                                                              |

**Returns:** <code>Promise&lt;<a href="#pluginlistenerhandle">PluginListenerHandle</a>&gt;</code>

**Since:** 0.1.0

--------------------


### addListener('onAppodealInitialized', ...)

```typescript
addListener(eventName: 'onAppodealInitialized', listenerFunc: (event: AppodealInitializedEvent) => void) => Promise<PluginListenerHandle>
```

Fires when the SDK has initialized. `errors` lists what went wrong with
mediated networks, if anything did; the SDK still serves ads from the
rest. The event is kept until the first listener is added, so it is not
missed if the SDK is quicker than the page.

| Param              | Type                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| **`eventName`**    | <code>'onAppodealInitialized'</code>                                                              |
| **`listenerFunc`** | <code>(event: <a href="#appodealinitializedevent">AppodealInitializedEvent</a>) =&gt; void</code> |

**Returns:** <code>Promise&lt;<a href="#pluginlistenerhandle">PluginListenerHandle</a>&gt;</code>

**Since:** 0.1.0

--------------------


### addListener('onBannerFailedToShow' | 'onRewardedVideoFailedToShow', ...)

```typescript
addListener(eventName: 'onBannerFailedToShow' | 'onRewardedVideoFailedToShow', listenerFunc: (event: AppodealFailedToShowEvent) => void) => Promise<PluginListenerHandle>
```

Fires when an ad that was asked to show did not. `message` says why
when the SDK gives a reason (iOS rewarded videos); `onBannerFailedToShow`
fires on Android only, as the iOS SDK does not report it.

| Param              | Type                                                                                                |
| ------------------ | --------------------------------------------------------------------------------------------------- |
| **`eventName`**    | <code>'onBannerFailedToShow' \| 'onRewardedVideoFailedToShow'</code>                                |
| **`listenerFunc`** | <code>(event: <a href="#appodealfailedtoshowevent">AppodealFailedToShowEvent</a>) =&gt; void</code> |

**Returns:** <code>Promise&lt;<a href="#pluginlistenerhandle">PluginListenerHandle</a>&gt;</code>

**Since:** 0.1.0

--------------------


### addListener('onInterstitialLoaded' | 'onRewardedVideoLoaded', ...)

```typescript
addListener(eventName: 'onInterstitialLoaded' | 'onRewardedVideoLoaded', listenerFunc: (event: AppodealLoadedEvent) => void) => Promise<PluginListenerHandle>
```

| Param              | Type                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------- |
| **`eventName`**    | <code>'onInterstitialLoaded' \| 'onRewardedVideoLoaded'</code>                          |
| **`listenerFunc`** | <code>(event: <a href="#appodealloadedevent">AppodealLoadedEvent</a>) =&gt; void</code> |

**Returns:** <code>Promise&lt;<a href="#pluginlistenerhandle">PluginListenerHandle</a>&gt;</code>

**Since:** 0.1.0

--------------------


### addListener('onBannerLoaded', ...)

```typescript
addListener(eventName: 'onBannerLoaded', listenerFunc: (event: AppodealBannerLoadedEvent) => void) => Promise<PluginListenerHandle>
```

Fires when a banner loads. `height` is the banner's height, which the
page should keep clear while the banner is shown. The last one is kept
until a listener is added, so a page that attaches after the banner has
loaded still hears about it.

| Param              | Type                                                                                                |
| ------------------ | --------------------------------------------------------------------------------------------------- |
| **`eventName`**    | <code>'onBannerLoaded'</code>                                                                       |
| **`listenerFunc`** | <code>(event: <a href="#appodealbannerloadedevent">AppodealBannerLoadedEvent</a>) =&gt; void</code> |

**Returns:** <code>Promise&lt;<a href="#pluginlistenerhandle">PluginListenerHandle</a>&gt;</code>

**Since:** 0.1.0

--------------------


### addListener('onRewardedVideoClosed', ...)

```typescript
addListener(eventName: 'onRewardedVideoClosed', listenerFunc: (event: AppodealRewardedVideoClosedEvent) => void) => Promise<PluginListenerHandle>
```

Fires when a rewarded video closes. `isFinished` is whether it was
watched to the end.

| Param              | Type                                                                                                              |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| **`eventName`**    | <code>'onRewardedVideoClosed'</code>                                                                              |
| **`listenerFunc`** | <code>(event: <a href="#appodealrewardedvideoclosedevent">AppodealRewardedVideoClosedEvent</a>) =&gt; void</code> |

**Returns:** <code>Promise&lt;<a href="#pluginlistenerhandle">PluginListenerHandle</a>&gt;</code>

**Since:** 0.1.0

--------------------


### addListener('onRewardedVideoFinished', ...)

```typescript
addListener(eventName: 'onRewardedVideoFinished', listenerFunc: (event: AppodealRewardedVideoFinishedEvent) => void) => Promise<PluginListenerHandle>
```

Fires when the user earns the reward.

| Param              | Type                                                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| **`eventName`**    | <code>'onRewardedVideoFinished'</code>                                                                                |
| **`listenerFunc`** | <code>(event: <a href="#appodealrewardedvideofinishedevent">AppodealRewardedVideoFinishedEvent</a>) =&gt; void</code> |

**Returns:** <code>Promise&lt;<a href="#pluginlistenerhandle">PluginListenerHandle</a>&gt;</code>

**Since:** 0.1.0

--------------------


### addListener('onAppodealDidReceiveRevenue', ...)

```typescript
addListener(eventName: 'onAppodealDidReceiveRevenue', listenerFunc: (revenue: AppodealAdRevenue) => void) => Promise<PluginListenerHandle>
```

Fires for every paid impression, of any ad type.

| Param              | Type                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------- |
| **`eventName`**    | <code>'onAppodealDidReceiveRevenue'</code>                                            |
| **`listenerFunc`** | <code>(revenue: <a href="#appodealadrevenue">AppodealAdRevenue</a>) =&gt; void</code> |

**Returns:** <code>Promise&lt;<a href="#pluginlistenerhandle">PluginListenerHandle</a>&gt;</code>

**Since:** 0.1.0

--------------------


### removeAllListeners()

```typescript
removeAllListeners() => Promise<void>
```

**Since:** 0.1.0

--------------------


### Interfaces


#### AppodealReward

| Prop         | Type                | Description                 | Since |
| ------------ | ------------------- | --------------------------- | ----- |
| **`name`**   | <code>string</code> | The reward's currency name. | 0.1.0 |
| **`amount`** | <code>string</code> |                             | 0.1.0 |


#### AppodealPurchaseValidationResult

What the validation returns. The fields are filled on Android; on iOS the
SDK returns Apple's validation response as is.

| Prop                   | Type                | Since |
| ---------------------- | ------------------- | ----- |
| **`publicKey`**        | <code>string</code> | 0.1.0 |
| **`signature`**        | <code>string</code> | 0.1.0 |
| **`purchaseData`**     | <code>string</code> | 0.1.0 |
| **`purchaseToken`**    | <code>string</code> | 0.1.0 |
| **`timestamp`**        | <code>number</code> | 0.1.0 |
| **`developerPayload`** | <code>string</code> | 0.1.0 |
| **`orderId`**          | <code>string</code> | 0.1.0 |
| **`sku`**              | <code>string</code> | 0.1.0 |
| **`price`**            | <code>string</code> | 0.1.0 |
| **`currency`**         | <code>string</code> | 0.1.0 |
| **`productType`**      | <code>number</code> | 0.1.0 |


#### AppodealIOSPurchase

| Prop                       | Type                                                                        | Since |
| -------------------------- | --------------------------------------------------------------------------- | ----- |
| **`productId`**            | <code>string</code>                                                         | 0.1.0 |
| **`productType`**          | <code><a href="#appodealiospurchasetype">AppodealIOSPurchaseType</a></code> | 0.1.0 |
| **`price`**                | <code>number</code>                                                         | 0.1.0 |
| **`currency`**             | <code>string</code>                                                         | 0.1.0 |
| **`transactionId`**        | <code>string</code>                                                         | 0.1.0 |
| **`additionalParameters`** | <code><a href="#appodealmap">AppodealMap</a> \| null</code>                 | 0.1.0 |


#### AppodealAndroidPurchase

| Prop                       | Type                                                                                | Since |
| -------------------------- | ----------------------------------------------------------------------------------- | ----- |
| **`publicKey`**            | <code>string</code>                                                                 | 0.1.0 |
| **`productType`**          | <code><a href="#appodealandroidpurchasetype">AppodealAndroidPurchaseType</a></code> | 0.1.0 |
| **`signature`**            | <code>string</code>                                                                 | 0.1.0 |
| **`purchaseData`**         | <code>string</code>                                                                 | 0.1.0 |
| **`purchaseToken`**        | <code>string</code>                                                                 | 0.1.0 |
| **`timestamp`**            | <code>number</code>                                                                 | 0.1.0 |
| **`developerPayload`**     | <code>string</code>                                                                 | 0.1.0 |
| **`price`**                | <code>string</code>                                                                 | 0.1.0 |
| **`currency`**             | <code>string</code>                                                                 | 0.1.0 |
| **`orderId`**              | <code>string</code>                                                                 | 0.1.0 |
| **`sku`**                  | <code>string</code>                                                                 | 0.1.0 |
| **`additionalParameters`** | <code><a href="#appodealmap">AppodealMap</a> \| null</code>                         | 0.1.0 |


#### PluginListenerHandle

| Prop         | Type                                      |
| ------------ | ----------------------------------------- |
| **`remove`** | <code>() =&gt; Promise&lt;void&gt;</code> |


#### AppodealInitializedEvent

| Prop         | Type                  | Description                                                                                                                        | Since |
| ------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----- |
| **`errors`** | <code>string[]</code> | Messages for the mediated networks that failed to initialize, if any. Reported on Android; iOS gives none and sends an empty list. | 0.2.0 |


#### AppodealFailedToShowEvent

| Prop          | Type                | Description                          | Since |
| ------------- | ------------------- | ------------------------------------ | ----- |
| **`message`** | <code>string</code> | The SDK's reason, when it gives one. | 0.2.0 |


#### AppodealLoadedEvent

| Prop             | Type                 | Since |
| ---------------- | -------------------- | ----- |
| **`isPrecache`** | <code>boolean</code> | 0.1.0 |


#### AppodealBannerLoadedEvent

| Prop         | Type                | Since |
| ------------ | ------------------- | ----- |
| **`height`** | <code>number</code> | 0.1.0 |


#### AppodealRewardedVideoClosedEvent

| Prop             | Type                 | Since |
| ---------------- | -------------------- | ----- |
| **`isFinished`** | <code>boolean</code> | 0.1.0 |


#### AppodealRewardedVideoFinishedEvent

| Prop           | Type                | Since |
| -------------- | ------------------- | ----- |
| **`amount`**   | <code>number</code> | 0.1.0 |
| **`currency`** | <code>string</code> | 0.1.0 |


#### AppodealAdRevenue

| Prop                   | Type                                                      | Since |
| ---------------------- | --------------------------------------------------------- | ----- |
| **`networkName`**      | <code>string</code>                                       | 0.1.0 |
| **`adUnitName`**       | <code>string</code>                                       | 0.1.0 |
| **`placement`**        | <code>string</code>                                       | 0.1.0 |
| **`revenuePrecision`** | <code>string</code>                                       | 0.1.0 |
| **`demandSource`**     | <code>string</code>                                       | 0.1.0 |
| **`currency`**         | <code>string</code>                                       | 0.1.0 |
| **`revenue`**          | <code>number</code>                                       | 0.1.0 |
| **`adType`**           | <code><a href="#appodealadtype">AppodealAdType</a></code> | 0.1.0 |


### Type Aliases


#### AppodealValue

<code>string | number | boolean | <a href="#appodealmap">AppodealMap</a> | null</code>


#### AppodealMap

<code>{ [key: string]: any }</code>


### Enums


#### AppodealAdType

| Members              | Value                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------- |
| **`NONE`**           | <code>0</code>                                                                               |
| **`INTERSTITIAL`**   | <code>1 &lt;&lt; 0</code>                                                                    |
| **`BANNER`**         | <code>1 &lt;&lt; 2</code>                                                                    |
| **`BANNER_BOTTOM`**  | <code>1 &lt;&lt; 3</code>                                                                    |
| **`BANNER_TOP`**     | <code>1 &lt;&lt; 4</code>                                                                    |
| **`REWARDED_VIDEO`** | <code>1 &lt;&lt; 5</code>                                                                    |
| **`MREC`**           | <code>1 &lt;&lt; 8</code>                                                                    |
| **`ALL`**            | <code>INTERSTITIAL \| BANNER \| BANNER_BOTTOM \| BANNER_TOP \| REWARDED_VIDEO \| MREC</code> |


#### AppodealConsentStatus

| Members            | Value          |
| ------------------ | -------------- |
| **`UNKNOWN`**      | <code>0</code> |
| **`REQUIRED`**     | <code>1</code> |
| **`NOT_REQUIRED`** | <code>2</code> |
| **`OBTAINED`**     | <code>3</code> |


#### AppodealPrivacyOptionsStatus

| Members            | Value          |
| ------------------ | -------------- |
| **`UNKNOWN`**      | <code>0</code> |
| **`REQUIRED`**     | <code>1</code> |
| **`NOT_REQUIRED`** | <code>2</code> |


#### AppodealLogLevel

| Members       | Value                  |
| ------------- | ---------------------- |
| **`NONE`**    | <code>'none'</code>    |
| **`DEBUG`**   | <code>'debug'</code>   |
| **`VERBOSE`** | <code>'verbose'</code> |


#### AppodealIOSPurchaseType

| Members                           | Value          |
| --------------------------------- | -------------- |
| **`CONSUMABLE`**                  | <code>0</code> |
| **`NON_CONSUMABLE`**              | <code>1</code> |
| **`AUTO_RENEWABLE_SUBSCRIPTION`** | <code>2</code> |
| **`NON_RENEWING_SUBSCRIPTION`**   | <code>3</code> |


#### AppodealAndroidPurchaseType

| Members            | Value          |
| ------------------ | -------------- |
| **`IN_APP`**       | <code>0</code> |
| **`SUBSCRIPTION`** | <code>1</code> |

</docgen-api>

## License

MIT
