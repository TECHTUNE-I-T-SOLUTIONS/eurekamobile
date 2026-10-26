import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import * as Linking from 'expo-linking';
import * as Updates from 'expo-updates';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { useTheme } from '../../context/ThemeContext';
import { Card } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import {
  Download,
  Sparkles,
  RefreshCw,
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  Info,
} from 'lucide-react-native';
import { VersionCheckResult } from '../../services/appUpdateService';

interface UpdateNoticeModalProps {
  visible: boolean;
  updateData: VersionCheckResult | null;
  onClose: () => void;
}

export function UpdateNoticeModal({
  visible,
  updateData,
  onClose,
}: UpdateNoticeModalProps) {
  const { theme, isDark } = useTheme();

  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [savedApkUri, setSavedApkUri] = useState<string | null>(null);

  if (!updateData || !updateData.hasUpdate) {
    return null;
  }

  const { isOTAUpdate, currentVersion, latestVersion, release, apkAsset } = updateData;

  const handleApplyOTA = async () => {
    try {
      setDownloading(true);
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch (e: any) {
      setDownloading(false);
      Alert.alert('Update Error', 'Could not apply update automatically: ' + (e?.message || 'Try again'));
    }
  };

  const handleOpenDownloadPage = () => {
    Linking.openURL('http://eureka.vercel.app/app');
  };

  const handleStreamDownloadApk = async () => {
    if (!apkAsset?.downloadUrl) {
      handleOpenDownloadPage();
      return;
    }

    try {
      setDownloading(true);
      setDownloadProgress(0);

      const targetFilename = `eureka-v${latestVersion || 'update'}.apk`;
      const targetUri = `${FileSystem.documentDirectory || FileSystem.cacheDirectory}${targetFilename}`;

      const downloadResumable = FileSystem.createDownloadResumable(
        apkAsset.downloadUrl,
        targetUri,
        {},
        (progress) => {
          if (progress.totalBytesExpectedToWrite > 0) {
            const p = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
            setDownloadProgress(Math.min(1, Math.max(0, p)));
          }
        }
      );

      const result = await downloadResumable.downloadAsync();
      setDownloading(false);

      if (result && result.uri) {
        setSavedApkUri(result.uri);
        setDownloadComplete(true);
        promptInstallApk(result.uri);
      } else {
        throw new Error('Download did not return file path');
      }
    } catch (err: any) {
      setDownloading(false);
      Alert.alert(
        'In-App Download Interrupted',
        'We will open the official download page so your browser can download it smoothly.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Page', onPress: handleOpenDownloadPage },
        ]
      );
    }
  };

  const promptInstallApk = async (localUri: string) => {
    if (Platform.OS === 'android') {
      try {
        const contentUri = await FileSystem.getContentUriAsync(localUri);
        // Use expo-intent-launcher for reliable APK package installer trigger
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          type: 'application/vnd.android.package-archive',
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        });
      } catch (intentErr) {
        // Fallback to Linking.sendIntent or browser
        try {
          const contentUri = await FileSystem.getContentUriAsync(localUri);
          await Linking.sendIntent('android.intent.action.VIEW', [
            { key: 'data', value: contentUri },
            { key: 'type', value: 'application/vnd.android.package-archive' },
            { key: 'flags', value: 1 },
          ]);
        } catch {
          Alert.alert(
            'Install Permission',
            "Android requires permission to install APKs. If prompted by your system, toggle 'Allow from this source', or download via your browser.",
            [
              { text: 'Browser Download', onPress: handleOpenDownloadPage },
              {
                text: 'Retry Install',
                onPress: () => promptInstallApk(localUri),
              },
            ]
          );
        }
      }
    } else {
      handleOpenDownloadPage();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.surfaceBorder,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: isDark
                      ? 'rgba(59, 130, 246, 0.15)'
                      : theme.colors.secondaryLight,
                  },
                ]}
              >
                <Sparkles size={22} color={theme.colors.secondary} />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={[theme.typography.h3, { color: theme.colors.textPrimary }]}>
                  {isOTAUpdate ? 'Quick Update Ready' : 'New Version Available!'}
                </Text>
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                  Current: v{currentVersion} → New: v{latestVersion}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Body info */}
          <View style={styles.body}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Badge
                variant="secondary"
                label={isOTAUpdate ? 'Instant Patch ⚡' : `v${latestVersion} Release 🚀`}
              />
              {apkAsset?.size ? (
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textTertiary, marginLeft: 8 },
                  ]}
                >
                  ~{(apkAsset.size / (1024 * 1024)).toFixed(1)} MB
                </Text>
              ) : null}
            </View>

            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textSecondary, lineHeight: 20, marginBottom: 12 },
              ]}
            >
              {isOTAUpdate
                ? 'An optimized instant patch is available. It will download the latest features and reload automatically.'
                : release?.releaseNotes ||
                  'A new version of Eureka is available with improved performance, stability updates, and lecture tools.'}
            </Text>

            {/* Android Install Permission Tip */}
            {!isOTAUpdate && (
              <View
                style={[
                  styles.noticeBox,
                  {
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : theme.colors.statusCompletedBg,
                    borderColor: theme.colors.surfaceBorder,
                  },
                ]}
              >
                <ShieldCheck size={18} color={theme.colors.accentEmerald} />
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textPrimary, marginLeft: 8, flex: 1, fontSize: 12 },
                  ]}
                >
                  No App Store needed! Android may ask to &quot;Allow install from this source&quot; to complete the update.
                </Text>
              </View>
            )}

            {/* Download Progress Bar */}
            {downloading && (
              <View style={{ marginTop: 14 }}>
                <View style={styles.progressRow}>
                  <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                    Downloading update...
                  </Text>
                  <Text style={[theme.typography.caption, { color: theme.colors.secondary, fontWeight: '700' }]}>
                    {Math.round(downloadProgress * 100)}%
                  </Text>
                </View>
                <View
                  style={[
                    styles.progressBarTrack,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.round(downloadProgress * 100)}%`,
                        backgroundColor: theme.colors.secondary,
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            {downloadComplete && (
              <View style={[styles.completeBadge, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                <CheckCircle2 size={16} color={theme.colors.accentEmerald} />
                <Text style={{ color: theme.colors.accentEmerald, fontSize: 12, fontWeight: '700', marginLeft: 6 }}>
                  APK Downloaded! Ready to install.
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.dismissBtn, { borderColor: theme.colors.surfaceBorder }]}
              activeOpacity={0.7}
              disabled={downloading}
            >
              <Text style={[theme.typography.bodyBold, { color: theme.colors.textSecondary }]}>
                Later
              </Text>
            </TouchableOpacity>

            {isOTAUpdate ? (
              <Button
                title={downloading ? 'Applying...' : 'Update & Restart'}
                onPress={handleApplyOTA}
                loading={downloading}
                size="md"
                style={{ flex: 1, marginLeft: 10 }}
                icon={<RefreshCw size={16} color="#FFF" />}
              />
            ) : downloadComplete && savedApkUri ? (
              <Button
                title="Install Update"
                onPress={() => promptInstallApk(savedApkUri)}
                size="md"
                style={{ flex: 1, marginLeft: 10 }}
                icon={<Download size={16} color="#FFF" />}
              />
            ) : (
              <Button
                title={downloading ? 'Downloading...' : 'Download & Install'}
                onPress={handleStreamDownloadApk}
                loading={downloading}
                size="md"
                style={{ flex: 1, marginLeft: 10 }}
                icon={<Download size={16} color="#FFF" />}
              />
            )}
          </View>

          {/* Web Download Page link */}
          {!isOTAUpdate && (
            <TouchableOpacity
              onPress={handleOpenDownloadPage}
              style={{ alignItems: 'center', marginTop: 12 }}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[theme.typography.caption, { color: theme.colors.secondary, fontWeight: '600' }]}>
                  Or download from official website
                </Text>
                <ExternalLink size={12} color={theme.colors.secondary} style={{ marginLeft: 4 }} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    marginBottom: 16,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    marginTop: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dismissBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
