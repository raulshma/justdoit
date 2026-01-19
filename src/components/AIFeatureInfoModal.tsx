import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Modal, Portal, Text, useTheme, Button, IconButton, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface AIFeatureInfo {
  id: string;
  title: string;
  description: string;
  howItWorks: string;
  privacy: string;
  executionDetails?: string;
  icon: string;
}

interface AIFeatureInfoModalProps {
  visible: boolean;
  featureInfo: AIFeatureInfo | null;
  onDismiss: () => void;
  onConfirm: () => void;
  mode?: 'confirm' | 'info';
}

export function AIFeatureInfoModal({
  visible,
  featureInfo,
  onDismiss,
  onConfirm,
  mode = 'confirm',
}: AIFeatureInfoModalProps) {
  const theme = useTheme();

  if (!featureInfo) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.background }]}
      >
        <SafeAreaView edges={['bottom']} style={styles.container}>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={{ fontWeight: 'bold', flex: 1 }}>
              {featureInfo.title}
            </Text>
            <IconButton icon="close" size={24} onPress={onDismiss} style={styles.closeButton} />
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                {featureInfo.description}
              </Text>
            </View>
            
            {featureInfo.executionDetails && (
              <Surface style={[styles.infoCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
                <View style={styles.cardHeader}>
                  <IconButton icon="clock-outline" size={20} iconColor={theme.colors.primary} style={{ margin: 0, marginRight: 8 }} />
                  <Text variant="titleMedium" style={{ fontWeight: '600', color: theme.colors.primary }}>
                    When it runs
                  </Text>
                </View>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                  {featureInfo.executionDetails}
                </Text>
              </Surface>
            )}

            <Surface style={[styles.infoCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
              <View style={styles.cardHeader}>
                <IconButton icon="information-outline" size={20} iconColor={theme.colors.primary} style={{ margin: 0, marginRight: 8 }} />
                <Text variant="titleMedium" style={{ fontWeight: '600', color: theme.colors.primary }}>
                  How it works
                </Text>
              </View>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                {featureInfo.howItWorks}
              </Text>
            </Surface>

            <Surface style={[styles.infoCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
              <View style={styles.cardHeader}>
                <IconButton icon="shield-check-outline" size={20} iconColor={theme.colors.primary} style={{ margin: 0, marginRight: 8 }} />
                <Text variant="titleMedium" style={{ fontWeight: '600', color: theme.colors.primary }}>
                  Privacy & Data
                </Text>
              </View>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                {featureInfo.privacy}
              </Text>
            </Surface>
          </ScrollView>

          <View style={styles.footer}>
            {mode === 'confirm' ? (
              <>
                <Button mode="outlined" onPress={onDismiss} style={styles.button}>
                  Cancel
                </Button>
                <Button mode="contained" onPress={onConfirm} style={styles.button}>
                  Enable Feature
                </Button>
              </>
            ) : (
              <Button mode="contained" onPress={onDismiss} style={styles.button}>
                Close
              </Button>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    margin: 20,
    borderRadius: 28,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  container: {
    flex: 0, // Allow modal to wrap content
  },
  header: {
    padding: 24,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    margin: -8,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 24,
  },
  infoCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  footer: {
    padding: 24,
    paddingTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
