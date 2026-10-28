import test from 'node:test';
import assert from 'node:assert/strict';
import { AdService, AdProvider, AdRewardResult } from './adProvider';

class MockTestProvider implements AdProvider {
  id = 'mock';
  name = 'Mock';
  isReady() { return true; }
  hasRewardedAd() { return true; }
  hasInterstitialAd() { return true; }
  async showRewardedRescue(): Promise<AdRewardResult> {
    return { rewarded: true, reason: 'completed' };
  }
  async showInterstitial(): Promise<boolean> {
    return true;
  }
}

test('AdService: duplicate rescue prevention', async () => {
  const service = new AdService();
  service.setProvider(new MockTestProvider());

  assert.equal(service.isRescueAvailable(), true);

  const res1 = await service.requestRewardedRescue();
  assert.equal(res1.rewarded, true);

  // Second attempt in the same run must be rejected
  assert.equal(service.isRescueAvailable(), false);
  const res2 = await service.requestRewardedRescue();
  assert.equal(res2.rewarded, false);

  // After resetting run, rescue is available again
  service.resetRunAdState();
  assert.equal(service.isRescueAvailable(), true);
});
