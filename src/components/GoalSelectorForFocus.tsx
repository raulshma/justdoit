import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Platform, 
  Keyboard,
  ScrollView,
  Modal as RNModal,
  TouchableWithoutFeedback,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import { Text, useTheme, IconButton, Searchbar } from 'react-native-paper';
import { goalManager } from '../services';
import type { Goal } from '../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GoalSelectorForFocusProps {
  visible: boolean;
  onDismiss: () => void;
  onSelect: (goalId: string, goalTitle: string) => void;
  onSelectNone: () => void;
}

/**
 * Gets today's date in ISO format (YYYY-MM-DD)
 */
const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * GoalSelectorForFocus Component
 * High-fidelity bottom sheet modal for goal selection
 * Uses React Native Modal for full screen coverage
 */
export const GoalSelectorForFocus: React.FC<GoalSelectorForFocusProps> = ({
  visible,
  onDismiss,
  onSelect,
  onSelectNone,
}) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Animate in/out when visibility changes
  useEffect(() => {
    if (visible) {
      // Animate in - backdrop fades, content slides up smoothly
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropAnim]);

  // Track keyboard visibility and height
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Reset search when modal closes
  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      Keyboard.dismiss();
    }
  }, [visible]);

  // Get today's incomplete goals
  const todayGoals = useMemo(() => {
    const allGoals = goalManager.getAllGoals();
    const today = getTodayDate();
    return allGoals
      .filter((goal) => goal.dueDate === today && !goal.isCompleted)
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }, [visible]);

  // Filter goals by search query
  const filteredGoals = useMemo(() => {
    if (!searchQuery.trim()) {
      return todayGoals;
    }
    const query = searchQuery.toLowerCase();
    return todayGoals.filter((goal) =>
      goal.title.toLowerCase().includes(query)
    );
  }, [todayGoals, searchQuery]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return theme.colors.error;
      case 'medium': return theme.colors.tertiary;
      case 'low': return theme.colors.secondary;
      default: return theme.colors.outline;
    }
  };

  const handleSelectGoal = (goalId: string, goalTitle: string) => {
    Keyboard.dismiss();
    onSelect(goalId, goalTitle);
  };

  const handleSelectNone = () => {
    Keyboard.dismiss();
    onSelectNone();
  };

  const handleDismiss = () => {
    Keyboard.dismiss();
    onDismiss();
  };

  const renderGoalItem = (item: Goal) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.goalItem, { backgroundColor: theme.colors.surface }]}
      onPress={() => handleSelectGoal(item.id, item.title)}
      activeOpacity={0.7}
    >
      <View style={[styles.priorityStrip, { backgroundColor: getPriorityColor(item.priority) }]} />
      
      <View style={styles.goalContent}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }} numberOfLines={1}>
          {item.title}
        </Text>
        
        <View style={styles.metaRow}>
          <View style={[styles.badge, { backgroundColor: theme.colors.surfaceVariant }]}>
             <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, textTransform: 'uppercase' }}>
               {item.priority}
             </Text>
          </View>
          
          {item.focusSessionsCompleted && item.focusSessionsCompleted > 0 ? (
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}>
              {item.focusSessionsCompleted} sessions
            </Text>
          ) : null}
        </View>
      </View>
      
      <IconButton 
        icon="chevron-right" 
        size={20} 
        iconColor={theme.colors.onSurfaceDisabled} 
      />
    </TouchableOpacity>
  );

  // Calculate modal height based on keyboard
  const modalMaxHeight = keyboardHeight > 0 
    ? SCREEN_HEIGHT - keyboardHeight - (StatusBar.currentHeight || 0)
    : SCREEN_HEIGHT * 0.85;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop - fades in */}
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <Animated.View 
            style={[
              styles.backdrop,
              { opacity: backdropAnim }
            ]} 
          />
        </TouchableWithoutFeedback>
        
        {/* Modal Content - slides up */}
        <Animated.View 
          style={[
            styles.modalContainer, 
            { 
              backgroundColor: theme.colors.elevation.level2,
              maxHeight: modalMaxHeight,
              marginBottom: keyboardHeight,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <View style={styles.dragHandle} />
          
          <View style={styles.header}>
            <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, fontWeight: '800' }}>
              Select Goal
            </Text>
            <IconButton icon="close" size={24} onPress={handleDismiss} />
          </View>

          <Searchbar
            placeholder="Search goals..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
            inputStyle={{ fontSize: 16 }}
            iconColor={theme.colors.onSurfaceVariant}
          />

          <ScrollView 
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* No Goal Option */}
            <TouchableOpacity
              style={[styles.noGoalButton, { borderColor: theme.colors.outlineVariant }]}
              onPress={handleSelectNone}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: theme.colors.primaryContainer }]}>
                <IconButton icon="timer-off" size={20} iconColor={theme.colors.primary} style={{ margin: 0 }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                  Just Focus
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Start a session without linking to a goal
                </Text>
              </View>
              <IconButton icon="chevron-right" size={20} iconColor={theme.colors.onSurfaceDisabled} />
            </TouchableOpacity>

            <Text variant="labelLarge" style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
              TODAY'S PRIORITIES
            </Text>

            {/* Goals List */}
            {filteredGoals.length > 0 ? (
              <View style={styles.goalsList}>
                {filteredGoals.map(renderGoalItem)}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                  {searchQuery ? 'No matching goals' : "No incomplete goals for today"}
                </Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    minHeight: '50%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(120, 120, 120, 0.4)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    marginHorizontal: 20,
    marginBottom: 16,
    elevation: 0,
    borderRadius: 16,
    height: 52,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  noGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 12,
    marginBottom: 24,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 1,
    fontSize: 12,
  },
  goalsList: {
    gap: 12,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    gap: 16,
    overflow: 'hidden',
  },
  priorityStrip: {
    width: 4,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  goalContent: {
    flex: 1,
    paddingLeft: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
});

export default GoalSelectorForFocus;
