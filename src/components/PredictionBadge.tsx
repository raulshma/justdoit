/**
 * PredictionBadge - Shows AI-predicted completion probability for a goal
 * Small badge with percentage and color-coded confidence
 */
import React, { memo, useCallback, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Portal, Modal, Surface, IconButton, Divider } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { ThemedIcon } from './ThemedIcon';
import type { CompletionPrediction, PredictionFactor } from '../types/advancedAITypes';

interface PredictionBadgeProps {
  prediction: CompletionPrediction;
  size?: 'small' | 'medium';
  showDetails?: boolean;
}

/**
 * Get color based on probability
 */
const getProbabilityColor = (
  probability: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  theme: any
): string => {
  if (probability >= 80) return theme.colors.primary;
  if (probability >= 60) return theme.colors.tertiary;
  if (probability >= 40) return theme.colors.secondary;
  return theme.colors.error;
};

/**
 * Factor list item
 */
const FactorItem = memo(({ factor }: { factor: PredictionFactor }) => {
  const theme = useTheme();
  const isPositive = factor.impact > 0;
  const color = isPositive ? theme.colors.primary : theme.colors.error;

  return (
    <View style={styles.factorItem}>
      <View style={styles.factorHeader}>
        <ThemedIcon
          name={isPositive ? 'trending-up' : 'trending-down'}
          size={16}
          color={color}
        />
        <Text variant="bodyMedium" style={{ marginLeft: 8, flex: 1, color: theme.colors.onSurface }}>
          {factor.name}
        </Text>
        <Text variant="labelMedium" style={{ color }}>
          {isPositive ? '+' : ''}{factor.impact}%
        </Text>
      </View>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
        {factor.explanation}
      </Text>
    </View>
  );
});

/**
 * Prediction Details Modal
 */
const PredictionDetailsModal = memo(({
  visible,
  prediction,
  onDismiss,
}: {
  visible: boolean;
  prediction: CompletionPrediction;
  onDismiss: () => void;
}) => {
  const theme = useTheme();
  const color = getProbabilityColor(prediction.probability, theme);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
      >
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderLeft}>
            <ThemedIcon name="crystal-ball" size={24} themeColor="primary" />
            <Text variant="titleMedium" style={{ marginLeft: 8 }}>
              Completion Prediction
            </Text>
          </View>
          <IconButton icon="close" onPress={onDismiss} size={20} />
        </View>

        {/* Probability Circle */}
        <View style={styles.probabilitySection}>
          <View style={[styles.probabilityCircle, { borderColor: color }]}>
            <Text variant="displaySmall" style={{ color, fontWeight: 'bold' }}>
              {prediction.probability}%
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              likely to complete
            </Text>
          </View>
          <View style={[styles.confidenceBadge, { backgroundColor: color + '20' }]}>
            <Text variant="labelSmall" style={{ color }}>
              {prediction.confidence.toUpperCase()} CONFIDENCE
            </Text>
          </View>
        </View>

        <Divider style={{ marginVertical: 16 }} />

        {/* Factors */}
        <Text variant="titleSmall" style={{ marginBottom: 12, color: theme.colors.onSurface }}>
          Contributing Factors
        </Text>
        {prediction.factors.map((factor, index) => (
          <FactorItem key={index} factor={factor} />
        ))}

        {/* Suggestions */}
        {prediction.suggestedActions && prediction.suggestedActions.length > 0 && (
          <>
            <Divider style={{ marginVertical: 16 }} />
            <Text variant="titleSmall" style={{ marginBottom: 12, color: theme.colors.onSurface }}>
              Improve Your Chances
            </Text>
            {prediction.suggestedActions.map((action, index) => (
              <View key={index} style={styles.suggestionItem}>
                <ThemedIcon name="lightbulb-on-outline" size={16} themeColor="primary" />
                <Text
                  variant="bodySmall"
                  style={{ marginLeft: 8, flex: 1, color: theme.colors.onSurfaceVariant }}
                >
                  {action}
                </Text>
              </View>
            ))}
          </>
        )}
      </Modal>
    </Portal>
  );
});

/**
 * Main PredictionBadge Component
 */
export const PredictionBadge: React.FC<PredictionBadgeProps> = memo(({
  prediction,
  size = 'small',
  showDetails = true,
}) => {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const color = getProbabilityColor(prediction.probability, theme);

  const handlePress = useCallback(() => {
    if (showDetails) {
      setModalVisible(true);
    }
  }, [showDetails]);

  const isSmall = size === 'small';

  return (
    <>
      <Animated.View entering={FadeIn.duration(300)}>
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={showDetails ? 0.7 : 1}
          style={[
            styles.badge,
            isSmall ? styles.badgeSmall : styles.badgeMedium,
            { backgroundColor: color + '20', borderColor: color },
          ]}
        >
          <ThemedIcon
            name="chart-line"
            size={isSmall ? 12 : 16}
            color={color}
          />
          <Text
            variant={isSmall ? 'labelSmall' : 'labelMedium'}
            style={{ color, fontWeight: '600', marginLeft: 4 }}
          >
            {prediction.probability}%
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {showDetails && (
        <PredictionDetailsModal
          visible={modalVisible}
          prediction={prediction}
          onDismiss={() => setModalVisible(false)}
        />
      )}
    </>
  );
});

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeMedium: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  probabilitySection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  probabilityCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
  },
  factorItem: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  factorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
});

export default PredictionBadge;
