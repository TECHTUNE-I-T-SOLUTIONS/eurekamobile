import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

export interface AppReleaseAsset {
  id: number;
  name: string;
  size: number;
  downloadCount: number;
  downloadUrl: string;
}

export interface AppRelease {
  id: number;
  version: string;
  tagName: string;
  name: string;
  isPrerelease: boolean;
  publishedAt: string;
  releaseNotes: string;
  assets: AppReleaseAsset[];
}

export interface VersionCheckResult {
  hasUpdate: boolean;
  isOTAUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  release?: AppRelease;
  apkAsset?: AppReleaseAsset;
}

/**
 * Compare two semver strings: '1.0.2' vs '1.0.1'
 * Returns > 0 if v1 > v2, < 0 if v1 < v2, 0 if equal
 */
export function compareSemver(v1: string, v2: string): number {
  const clean1 = (v1 || '0.0.0').replace(/^v/, '').split('-')[0];
  const clean2 = (v2 || '0.0.0').replace(/^v/, '').split('-')[0];

  const p1 = clean1.split('.').map((n) => parseInt(n, 10) || 0);
  const p2 = clean2.split('.').map((n) => parseInt(n, 10) || 0);

  const len = Math.max(p1.length, p2.length);
  for (let i = 0; i < len; i++) {
    const a = p1[i] ?? 0;
    const b = p2[i] ?? 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }
  return 0;
}

export const appUpdateService = {
  getCurrentVersion(): string {
    return Constants.expoConfig?.version || '1.0.1';
  },

  /**
   * Check if an OTA JS update or a new Native APK release exists
   */
  async checkForUpdates(): Promise<VersionCheckResult> {
    const currentVersion = this.getCurrentVersion();

    // 1. Check for OTA (EAS Update) first if not in development
    try {
      if (!__DEV__ && Updates.isEnabled) {
        const updateCheck = await Updates.checkForUpdateAsync();
        if (updateCheck.isAvailable) {
          return {
            hasUpdate: true,
            isOTAUpdate: true,
            currentVersion,
            latestVersion: currentVersion,
          };
        }
      }
    } catch (e) {
      // OTA check failed or running in dev; continue to GitHub check
    }

    // 2. Check web backend endpoint for GitHub release APKs
    try {
      const response = await fetch('http://eureka.vercel.app/api/app/releases?limit=5', {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return { hasUpdate: false, isOTAUpdate: false, currentVersion };
      }

      const releases: AppRelease[] = await response.json();
      if (!Array.isArray(releases) || releases.length === 0) {
        return { hasUpdate: false, isOTAUpdate: false, currentVersion };
      }

      // Find newest stable release that has an APK
      const latestStable = releases.find((r) => !r.isPrerelease && r.assets.some((a) => a.name.endsWith('.apk'))) || releases[0];

      if (!latestStable) {
        return { hasUpdate: false, isOTAUpdate: false, currentVersion };
      }

      const apkAsset = latestStable.assets.find((a) => a.name.endsWith('.apk'));
      const isNewer = compareSemver(latestStable.version, currentVersion) > 0;

      if (isNewer && apkAsset) {
        return {
          hasUpdate: true,
          isOTAUpdate: false,
          currentVersion,
          latestVersion: latestStable.version,
          release: latestStable,
          apkAsset,
        };
      }
    } catch (error) {
      console.log('[UpdateCheck] Release fetch error:', error);
    }

    return { hasUpdate: false, isOTAUpdate: false, currentVersion };
  },
};
