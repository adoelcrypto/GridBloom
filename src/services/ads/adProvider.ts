/**
 * GridBloom - Provider-Neutral Ad & Monetization Service
 * Supports rewarded rescue and interstitial caps with zero fake promises.
 */

export interface AdRewardResult {
  readonly rewarded: boolean;
  readonly reason?: 'completed' | 'skipped' | 'failed' | 'unavailable' | 'disabled';
}

export interface AdProvider {
  readonly id: string;
  readonly name: string;
  isReady(): boolean;
  hasRewardedAd(): boolean;
  hasInterstitialAd(): boolean;
  showRewardedRescue(): Promise<AdRewardResult>;
  showInterstitial(): Promise<boolean>;
}

export class NullAdProvider implements AdProvider {
  readonly id = 'null';
  readonly name = 'Disabled';

  isReady(): boolean {
    return false;
  }
  hasRewardedAd(): boolean {
    return false;
  }
  hasInterstitialAd(): boolean {
    return false;
  }
  async showRewardedRescue(): Promise<AdRewardResult> {
    return { rewarded: false, reason: 'disabled' };
  }
  async showInterstitial(): Promise<boolean> {
    return false;
  }
}

/**
 * Dev/Test Ad provider for local development verification when enabled explicitly
 */
export class TestAdProvider implements AdProvider {
  readonly id = 'test';
  readonly name = 'Test Simulation Provider';

  isReady(): boolean {
    return true;
  }
  hasRewardedAd(): boolean {
    return true;
  }
  hasInterstitialAd(): boolean {
    return true;
  }

  async showRewardedRescue(): Promise<AdRewardResult> {
    // Simulates an interactive mock test rewarded ad modal with delay
    return new Promise((resolve) => {
      const confirmed = window.confirm(
        '【TEST AD】Simulated Rewarded Ad\nWatch test video to rescue this run?\nClick OK to simulate completion, Cancel to simulate skip.'
      );
      if (confirmed) {
        resolve({ rewarded: true, reason: 'completed' });
      } else {
        resolve({ rewarded: false, reason: 'skipped' });
      }
    });
  }

  async showInterstitial(): Promise<boolean> {
    return true;
  }
}

export class AdService {
  private provider: AdProvider;
  private runsCount: number = 0;
  private rescueUsedInCurrentRun: boolean = false;
  private lastInterstitialRun: number = 0;

  constructor() {
    const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {};
    const adsEnabled = env.VITE_ADS_ENABLED === 'true';
    const providerName = env.VITE_AD_PROVIDER;

    if (adsEnabled && providerName === 'test') {
      this.provider = new TestAdProvider();
    } else {
      this.provider = new NullAdProvider();
    }
  }

  public setProvider(provider: AdProvider): void {
    this.provider = provider;
  }

  public getProvider(): AdProvider {
    return this.provider;
  }

  public isRescueAvailable(): boolean {
    return !this.rescueUsedInCurrentRun && this.provider.hasRewardedAd();
  }

  public resetRunAdState(): void {
    this.rescueUsedInCurrentRun = false;
  }

  public async requestRewardedRescue(): Promise<AdRewardResult> {
    if (this.rescueUsedInCurrentRun) {
      return { rewarded: false, reason: 'failed' };
    }

    const result = await this.provider.showRewardedRescue();
    if (result.rewarded) {
      this.rescueUsedInCurrentRun = true;
    }
    return result;
  }

  public onRunCompleted(): void {
    this.runsCount++;
    // Conservative interstitial policy: never on 1st run, and only once every 3 completed runs
    if (this.runsCount > 1 && this.runsCount - this.lastInterstitialRun >= 3) {
      if (this.provider.hasInterstitialAd()) {
        this.provider.showInterstitial().catch(() => {});
        this.lastInterstitialRun = this.runsCount;
      }
    }
  }
}

export const adService = new AdService();
