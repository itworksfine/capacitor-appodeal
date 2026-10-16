import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { AppodealAdType, AppodealConsentStatus, AppodealPrivacyOptionsStatus } from './definitions';
import { PLUGIN_VERSION } from './version';
import { AppodealWeb } from './web';

describe('AppodealWeb', () => {
  const plugin = new AppodealWeb();

  it('reports the version from package.json', async () => {
    const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    expect(PLUGIN_VERSION).toBe(version);
    await expect(plugin.getVersion()).resolves.toEqual({ version });
  });

  it('lets a consent-first start-up run through in the browser', async () => {
    await expect(plugin.requestConsentInfoUpdate()).resolves.toEqual({ status: AppodealConsentStatus.NOT_REQUIRED });
    await expect(plugin.showConsentFormIfNeeded()).resolves.toEqual({ status: AppodealConsentStatus.NOT_REQUIRED });
    await expect(plugin.privacyOptionsRequirementStatus()).resolves.toEqual({
      status: AppodealPrivacyOptionsStatus.NOT_REQUIRED,
    });
    await expect(plugin.showPrivacyOptionsForm()).resolves.toBeUndefined();
  });

  it('answers as if nothing were loaded', async () => {
    await expect(plugin.isLoaded({ adTypes: AppodealAdType.BANNER })).resolves.toEqual({ isLoaded: false });
    await expect(plugin.canShow({ adTypes: AppodealAdType.INTERSTITIAL })).resolves.toEqual({ canShow: false });
    await expect(plugin.hide({ adTypes: AppodealAdType.BANNER })).resolves.toBeUndefined();
  });

  it('rejects what needs the native SDK', async () => {
    await expect(plugin.initialize()).rejects.toMatchObject({ code: 'UNAVAILABLE' });
    await expect(plugin.show()).rejects.toMatchObject({ code: 'UNAVAILABLE' });
  });
});
