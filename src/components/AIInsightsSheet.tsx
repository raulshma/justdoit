import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Modal, Portal, Text, IconButton, useTheme, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PatternInsight, MotivationalMessage, RescheduleSuggestion } from '../types';
import { MotivationalMessageCard } from './MotivationalMessageCard';
import { RescheduleSuggestionCard } from './RescheduleSuggestionCard';
import { PatternInsightCard } from './PatternInsightCard';
import { ThemedIcon } from './ThemedIcon';

interface AIInsightsSheetProps {
  visible: boolean;
  onDismiss: () => void;
  patternInsights: PatternInsight[];
  motivationalMessage: MotivationalMessage | null;
  rescheduleSuggestions: RescheduleSuggestion[];
  onAcceptReschedule: (suggestion: RescheduleSuggestion) => void;
  onModifyReschedule: (suggestion: RescheduleSuggestion) => void;
  onDismissReschedule: (goalId: string) => void;
  onDismissPatternInsight: (id: string) => void;
  onDismissMotivation: () => void;
}

export function AIInsightsSheet({
  visible,
  onDismiss,
  patternInsights,
  motivationalMessage,
  rescheduleSuggestions,
  onAcceptReschedule,
  onModifyReschedule,
  onDismissReschedule,
  onDismissPatternInsight,
  onDismissMotivation,
}: AIInsightsSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get('window').height;

  // Calculate if we have any content
  const hasContent = 
    patternInsights.length > 0 || 
    motivationalMessage !== null || 
    rescheduleSuggestions.length > 0;

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
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <ThemedIcon name="auto-fix" size={24} themeColor="primary" />
            <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onSurface }]}>
              AI Insights
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
          {!hasContent ? (
            <View style={styles.emptyState}>
              <ThemedIcon name="check-circle-outline" size={48} themeColor="secondary" />
              <Text variant="bodyLarge" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                No new insights at the moment.
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.outline, textAlign: 'center' }}>
                Check back later for personalized suggestions!
              </Text>
            </View>
          ) : (
            <>
              {/* Motivational Message */}
              {motivationalMessage && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <ThemedIcon name="message-text-outline" size={20} themeColor="tertiary" />
                    <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.tertiary }]}>
                      Motivation
                    </Text>
                  </View>
                  <MotivationalMessageCard 
                    message={motivationalMessage} 
                    onDismiss={onDismissMotivation} 
                  />
                </View>
              )}

              {/* Reschedule Suggestions */}
              {rescheduleSuggestions.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <ThemedIcon name="calendar-clock" size={20} themeColor="error" />
                    <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.error }]}>
                      Needs Attention
                    </Text>
                  </View>
                  {rescheduleSuggestions.map((suggestion) => (
                    <RescheduleSuggestionCard
                      key={suggestion.goalId}
                      suggestion={suggestion}
                      onAccept={onAcceptReschedule}
                      onModify={onModifyReschedule}
                      onDismiss={onDismissReschedule}
                    />
                  ))}
                </View>
              )}

              {/* Pattern Insights */}
              {patternInsights.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <ThemedIcon name="chart-timeline-variant" size={20} themeColor="primary" />
                    <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
                      Patterns Detected
                    </Text>
                  </View>
                  {patternInsights.map((insight) => (
                    <PatternInsightCard 
                      key={insight.id} 
                      insight={insight} 
                      onDismiss={onDismissPatternInsight} 
                    />
                  ))}
                </View>
              )}
            </>
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
    maxHeight: '80%',
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
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontWeight: '600',
  },
});
