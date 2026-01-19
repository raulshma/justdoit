import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, IconButton, Modal, Portal, Snackbar, Surface, Text, useTheme } from 'react-native-paper';

import { useSettings } from '../context/SettingsContext';
import { backupService, convexSyncService } from '../services';
import { AdvancedSettingRow } from '../components/settings/AdvancedSettingRow';

/**
 * DataBackupSettingsScreen
 *
 * Extracted from SettingsScreen. Functionality is preserved; the UI is now
 * presented as its own page/modal.
 */
export function DataBackupSettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const [showConvexCredentialsModal, setShowConvexCredentialsModal] = useState(false);
  const [convexUrlInput, setConvexUrlInput] = useState('');
  const [convexTokenInput, setConvexTokenInput] = useState('');

  const snackbarBottom = insets.bottom + 16;

  const saveSettings = useCallback(
    async (updates: { convexUrl?: string; convexToken?: string }, message: string) => {
      try {
        await updateSettings(updates);
        setSnackbarMessage(message);
        setSnackbarVisible(true);
      } catch (error) {
        console.error('Failed to save settings:', error);
        setSnackbarMessage('Error saving settings');
        setSnackbarVisible(true);
      }
    },
    [updateSettings]
  );

  const handleExportData = useCallback(async () => {
    setIsExporting(true);
    try {
      const result = await backupService.exportToFile();
      if (result.success) {
        setSnackbarMessage('Data exported successfully');
      } else {
        setSnackbarMessage(result.error || 'Export failed');
      }
      setSnackbarVisible(true);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleImportData = useCallback(async () => {
    setIsImporting(true);
    try {
      const result = await backupService.importFromFile();
      if (result.success) {
        setSnackbarMessage('Data imported! Restart the app to see changes.');
      } else if (result.error !== 'No file selected') {
        setSnackbarMessage(result.error || 'Import failed');
      }
      setSnackbarVisible(true);
    } finally {
      setIsImporting(false);
    }
  }, []);

  const handleSaveConvexCredentials = useCallback(async () => {
    setShowConvexCredentialsModal(false);
    const updates: { convexUrl?: string; convexToken?: string } = {};

    if (convexUrlInput.trim()) {
      updates.convexUrl = convexUrlInput.trim();
    }
    if (convexTokenInput.trim()) {
      updates.convexToken = convexTokenInput.trim();
    }

    if (Object.keys(updates).length > 0) {
      await saveSettings(updates, 'Convex credentials saved');
    }

    setConvexUrlInput('');
    setConvexTokenInput('');
  }, [convexTokenInput, convexUrlInput, saveSettings]);

  const handleSyncToCloud = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await convexSyncService.syncToCloud();
      if (result.success) {
        setSnackbarMessage('Data synced to cloud!');
      } else {
        setSnackbarMessage(result.error || 'Sync failed');
      }
      setSnackbarVisible(true);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const handleRestoreFromCloud = useCallback(async () => {
    setIsRestoring(true);
    try {
      const result = await convexSyncService.syncFromCloud();
      if (result.success) {
        setSnackbarMessage('Data restored! Restart the app to see changes.');
      } else {
        setSnackbarMessage(result.error || 'Restore failed');
      }
      setSnackbarVisible(true);
    } finally {
      setIsRestoring(false);
    }
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <IconButton icon="arrow-left" size={24} onPress={() => router.back()} />
            <View style={styles.headerText}>
              <Text variant="headlineMedium" style={styles.headerTitle}>
                Data & Backup
              </Text>
              <Text variant="bodyLarge" style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                Export, import, and cloud sync
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text variant="labelLarge" style={[styles.sectionHeader, { color: theme.colors.primary }]}>
            DATA & BACKUP
          </Text>
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
            <AdvancedSettingRow
              icon="export"
              title="Export Data"
              subtitle="Save all your data to a file"
              onPress={handleExportData}
              disabled={isExporting}
              rightText={isExporting ? 'Exporting...' : undefined}
              badgeText={!isExporting ? 'JSON' : undefined}
            />
            <AdvancedSettingRow
              icon="import"
              title="Import Data"
              subtitle="Restore from a backup file"
              onPress={handleImportData}
              disabled={isImporting}
              rightText={isImporting ? 'Importing...' : undefined}
              badgeText={!isImporting ? 'Restore' : undefined}
            />
            <AdvancedSettingRow
              icon="cloud-sync-outline"
              title="Convex Credentials"
              subtitle={settings.convexUrl && settings.convexToken ? 'Configured' : 'Set URL and Token for cloud sync'}
              onPress={() => {
                setConvexUrlInput(settings.convexUrl || '');
                setConvexTokenInput(settings.convexToken || '');
                setShowConvexCredentialsModal(true);
              }}
              badgeText={settings.convexUrl && settings.convexToken ? 'Ready' : 'Setup'}
              badgeTone={settings.convexUrl && settings.convexToken ? 'primary' : 'secondary'}
              isLast={!(settings.convexUrl && settings.convexToken)}
            />

            {settings.convexUrl && settings.convexToken && (
              <>
                <AdvancedSettingRow
                  icon="cloud-upload-outline"
                  title="Sync to Cloud"
                  subtitle="Upload your data to Convex"
                  onPress={handleSyncToCloud}
                  disabled={isSyncing}
                  rightText={isSyncing ? 'Syncing...' : undefined}
                  badgeText={!isSyncing ? 'Sync' : undefined}
                  badgeTone={!isSyncing ? 'primary' : 'secondary'}
                />
                <AdvancedSettingRow
                  icon="cloud-download-outline"
                  title="Restore from Cloud"
                  subtitle="Download your data from Convex"
                  onPress={handleRestoreFromCloud}
                  disabled={isRestoring}
                  rightText={isRestoring ? 'Restoring...' : undefined}
                  badgeText={!isRestoring ? 'Restore' : undefined}
                  isLast={true}
                />
              </>
            )}
          </Surface>
        </View>

        <View style={styles.footerSpacing} />
      </ScrollView>

      <Portal>
        <Modal
          visible={showConvexCredentialsModal}
          onDismiss={() => {
            setShowConvexCredentialsModal(false);
            setConvexUrlInput('');
            setConvexTokenInput('');
          }}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            Convex Credentials
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginBottom: 16 }}
          >
            Enter your Convex deployment URL and auth token
          </Text>

          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
            Deployment URL
          </Text>
          <TextInput
            value={convexUrlInput}
            onChangeText={setConvexUrlInput}
            placeholder="https://your-project.convex.cloud"
            placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
            style={[
              styles.textInput,
              {
                backgroundColor: theme.colors.surfaceVariant + '50',
                color: theme.colors.onSurface,
                borderColor: theme.colors.outline + '30',
                marginBottom: 12,
              },
            ]}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
            Auth Token
          </Text>
          <TextInput
            value={convexTokenInput}
            onChangeText={setConvexTokenInput}
            placeholder="Your secure token"
            placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
            secureTextEntry
            style={[
              styles.textInput,
              {
                backgroundColor: theme.colors.surfaceVariant + '50',
                color: theme.colors.onSurface,
                borderColor: theme.colors.outline + '30',
              },
            ]}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.modalButtons}>
            <Button
              mode="text"
              onPress={() => {
                setShowConvexCredentialsModal(false);
                setConvexUrlInput('');
                setConvexTokenInput('');
              }}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSaveConvexCredentials}
              disabled={!convexUrlInput.trim() && !convexTokenInput.trim()}
            >
              Save
            </Button>
          </View>
        </Modal>
      </Portal>

      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={2000}
          style={[styles.snackbar, { marginBottom: snackbarBottom }]}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    marginTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
    fontSize: 28,
  },
  headerSubtitle: {
    opacity: 0.6,
    marginTop: 4,
    fontSize: 15,
    letterSpacing: -0.2,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
    marginLeft: 8,
    fontWeight: '700',
    letterSpacing: 2,
    fontSize: 11,
    opacity: 0.6,
  },
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
  },
  footerSpacing: {
    height: 40,
  },
  modalContainer: {
    margin: 20,
    padding: 24,
    borderRadius: 28,
    maxHeight: '80%',
    elevation: 4,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '700',
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  snackbar: {
    zIndex: 1200,
    elevation: 12,
  },
});

export default DataBackupSettingsScreen;
