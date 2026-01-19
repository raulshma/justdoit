import React from 'react';
import { View, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import { Modal, Portal, Text, IconButton, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AILogEntry } from '../types';
import { ThemedIcon } from './ThemedIcon';

interface LogDetailsSheetProps {
  visible: boolean;
  onDismiss: () => void;
  logEntry: AILogEntry | null;
}

export function LogDetailsSheet({
  visible,
  onDismiss,
  logEntry,
}: LogDetailsSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  if (!logEntry) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContent,
          { 
            backgroundColor: theme.colors.surface,
            paddingBottom: insets.bottom + 20 
          }
        ]}
        style={styles.modal}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <ThemedIcon name="code-json" size={24} themeColor="primary" />
            <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onSurface }]}>
              Log Details
            </Text>
          </View>
          <IconButton
            icon="close"
            size={24}
            onPress={onDismiss}
            iconColor={theme.colors.onSurfaceVariant}
          />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Info */}
          <View style={styles.section}>
            <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
              Request Type
            </Text>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
              {logEntry.type.replace('_', ' ').toUpperCase()}
            </Text>

            <Text variant="labelMedium" style={{ color: theme.colors.primary, marginTop: 12 }}>
              Model
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {logEntry.request.model}
            </Text>
          </View>

          {/* Prompt */}
          <View style={styles.section}>
            <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
              Prompt
            </Text>
            <View style={[styles.codeBox, { backgroundColor: theme.colors.surfaceVariant + '50' }]}>
              <Text 
                variant="bodySmall" 
                selectable
                style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}
              >
                {logEntry.request.prompt}
              </Text>
            </View>
          </View>

          {/* Response Data (Parsed) */}
          {logEntry.response.success && logEntry.response.data !== undefined && (
            <View style={styles.section}>
              <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                Response Data
              </Text>
              <View style={[styles.codeBox, { backgroundColor: theme.colors.surfaceVariant + '50' }]}>
                <Text 
                  variant="bodySmall" 
                  selectable
                  style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}
                >
                  {JSON.stringify(logEntry.response.data, null, 2)}
                </Text>
              </View>
            </View>
          )}

          {/* Error Message */}
          {!logEntry.response.success && logEntry.response.error && (
            <View style={styles.section}>
              <Text variant="labelMedium" style={{ color: theme.colors.error }}>
                Error
              </Text>
              <View style={[styles.errorBox, { backgroundColor: theme.colors.errorContainer + '40' }]}>
                <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
                  {logEntry.response.error}
                </Text>
              </View>
            </View>
          )}

          {/* Provider Metadata / Token Usage */}
          {logEntry.providerMetadata && (
            <View style={styles.section}>
              <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                Token Usage & Metadata
              </Text>
              <View style={[styles.metadataBox, { backgroundColor: theme.colors.surfaceVariant + '30', borderColor: theme.colors.outlineVariant }]}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Input Tokens: {logEntry.providerMetadata.inputTokens ?? 'N/A'}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Output Tokens: {logEntry.providerMetadata.outputTokens ?? 'N/A'}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: 'bold' }}>
                  Total Tokens: {logEntry.providerMetadata.totalTokens ?? 'N/A'}
                </Text>
                {logEntry.providerMetadata.modelId && (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                    Model ID: {logEntry.providerMetadata.modelId}
                  </Text>
                )}
                {logEntry.providerMetadata.finishReason && (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Finish Reason: {logEntry.providerMetadata.finishReason}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Raw Request Body */}
          {logEntry.request.body && (
            <View style={styles.section}>
              <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                Raw Request Body
              </Text>
              <View style={[styles.codeBox, { backgroundColor: theme.colors.surfaceVariant + '50' }]}>
                <Text 
                  variant="bodySmall" 
                  selectable
                  style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}
                >
                  {JSON.stringify(logEntry.request.body, null, 2)}
                </Text>
              </View>
            </View>
          )}

          {/* Raw Response */}
          {(logEntry.response.rawText || logEntry.response.body !== undefined) && (
            <View style={styles.section}>
              <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                Raw Response
              </Text>
              <View style={[styles.codeBox, { backgroundColor: theme.colors.surfaceVariant + '50' }]}>
                <Text 
                  variant="bodySmall" 
                  selectable
                  style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}
                >
                  {logEntry.response.rawText || JSON.stringify(logEntry.response.body, null, 2)}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontWeight: '700',
  },
  scrollView: {
    maxHeight: '100%',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 24,
  },
  section: {
    gap: 8,
  },
  codeBox: {
    padding: 12,
    borderRadius: 10,
  },
  metadataBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
    gap: 2,
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
  },
});
