import {
  Appodeal,
  AppodealAdType,
  AppodealBannerEvents,
  AppodealInterstitialEvents,
  AppodealLogLevel,
  AppodealRewardedEvents,
  AppodealSdkEvents,
} from '@itworksfine/capacitor-appodeal';

const appKeyInput = document.getElementById('appKey');
appKeyInput.value = localStorage.getItem('appKey') ?? '';
appKeyInput.addEventListener('change', () => localStorage.setItem('appKey', appKeyInput.value.trim()));
const appKey = () => appKeyInput.value.trim();

const log = (...parts) => {
  const line = parts.map((p) => (typeof p === 'string' ? p : JSON.stringify(p))).join(' ');
  document.getElementById('log').textContent = `${line}\n${document.getElementById('log').textContent}`;
};

const adTypes = AppodealAdType.INTERSTITIAL | AppodealAdType.REWARDED_VIDEO | AppodealAdType.BANNER;

const actions = {
  consent: async () => {
    await Appodeal.requestConsentInfoUpdate({ appKey: appKey() });
    return Appodeal.showConsentFormIfNeeded();
  },
  initialize: async () => {
    await Appodeal.setTesting({ value: true });
    await Appodeal.setLogLevel({ value: AppodealLogLevel.VERBOSE });
    return Appodeal.initialize({ appKey: appKey(), adTypes });
  },
  privacy: () => Appodeal.showPrivacyOptionsForm(),
  interstitial: () => Appodeal.show({ adTypes: AppodealAdType.INTERSTITIAL }),
  rewarded: () => Appodeal.show({ adTypes: AppodealAdType.REWARDED_VIDEO }),
  bannerBottom: () => Appodeal.show({ adTypes: AppodealAdType.BANNER_BOTTOM }),
  hideBanner: async () => {
    await Appodeal.hide({ adTypes: AppodealAdType.BANNER });
    document.body.style.setProperty('--banner-height', '0px');
  },
  status: async () => ({
    interstitial: (await Appodeal.isLoaded({ adTypes: AppodealAdType.INTERSTITIAL })).isLoaded,
    rewarded: (await Appodeal.isLoaded({ adTypes: AppodealAdType.REWARDED_VIDEO })).isLoaded,
    banner: (await Appodeal.isLoaded({ adTypes: AppodealAdType.BANNER_BOTTOM })).isLoaded,
  }),
};

document.addEventListener('click', async (event) => {
  const action = event.target.dataset?.action;
  if (!action) return;
  try {
    log(`${action} →`, (await actions[action]()) ?? 'ok');
  } catch (error) {
    log(`${action} ✗`, error.code ?? '', error.message);
  }
});

Appodeal.addListener(AppodealBannerEvents.LOADED, ({ height }) => {
  document.body.style.setProperty('--banner-height', `${height}px`);
});

for (const events of [AppodealSdkEvents, AppodealBannerEvents, AppodealInterstitialEvents, AppodealRewardedEvents]) {
  for (const name of Object.values(events)) {
    Appodeal.addListener(name, (data) => log(`event ${name}`, data ?? ''));
  }
}
