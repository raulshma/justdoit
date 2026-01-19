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
import { Text, useTheme, IconButton, Searchbar, Icon } from 'react-native-paper';
import { goalManager } from '../services';
import type { Goal } from '../types';
import { CustomDurationPicker } from './CustomDurationPicker';
import { getTodayDate } from '../utils/dateUtils';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GoalSelectorForFocusProps {
  visible: boolean;
  onDismiss: () => void;
  onSelect: (goalId: string, goalTitle: string, durationMinutes: number) => void;
  onSelectNone: (durationMinutes: number) => void;
  defaultDuration?: number;
}



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
  defaultDuration = 25,
}) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Duration picker state
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [pendingGoal, setPendingGoal] = useState<{ id: string; title: string } | null>(null);
  const [isNoGoalMode, setIsNoGoalMode] = useState(false);
  
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
    setPendingGoal({ id: goalId, title: goalTitle });
    setIsNoGoalMode(false);
    setShowDurationPicker(true);
  };

  const handleSelectNone = () => {
    Keyboard.dismiss();
    setPendingGoal(null);
    setIsNoGoalMode(true);
    setShowDurationPicker(true);
  };

  const handleDurationSelect = (durationMinutes: number) => {
    setShowDurationPicker(false);
    if (isNoGoalMode) {
      onSelectNone(durationMinutes);
    } else if (pendingGoal) {
      onSelect(pendingGoal.id, pendingGoal.title, durationMinutes);
    }
    // Reset state
    setPendingGoal(null);
    setIsNoGoalMode(false);
  };

  const handleDurationPickerDismiss = () => {
    setShowDurationPicker(false);
    setPendingGoal(null);
    setIsNoGoalMode(false);
  };

  const handleDismiss = () => {
    Keyboard.dismiss();
    setPendingGoal(null);
    setIsNoGoalMode(false);
    setShowDurationPicker(false);
    onDismiss();
  };

  const renderGoalItem = (item: Goal) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.goalItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant + '40' }]}
      onPress={() => handleSelectGoal(item.id, item.title)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.secondaryContainer }]}>
        <Icon source="target" size={24} color={theme.colors.onSecondaryContainer} />
      </View>
      
      <View style={styles.goalContent}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700', marginBottom: 4 }} numberOfLines={1}>
          {item.title}
        </Text>
        
        <View style={styles.metaRow}>
          <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.priority) }]} />
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, textTransform: 'capitalize', marginLeft: 6, fontWeight: '600' }}>
            {item.priority} Priority
          </Text>
          
          {item.focusSessionsCompleted && item.focusSessionsCompleted > 0 ? (
            <>
              <Text style={{ color: theme.colors.outline, marginHorizontal: 6 }}>•</Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {item.focusSessionsCompleted} sessions
              </Text>
            </>
          ) : null}
        </View>
      </View>
      
      <View style={[styles.chevronContainer, { backgroundColor: theme.colors.surfaceVariant + '80' }]}>
        <IconButton 
          icon="chevron-right" 
          size={18} 
          iconColor={theme.colors.onSurfaceVariant} 
          style={{ margin: 0 }}
        />
      </View>
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
            <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, fontWeight: '800', letterSpacing: -0.5 }}>
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
              style={[styles.noGoalButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant + '40' }]}
              onPress={handleSelectNone}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: theme.colors.primaryContainer }]}>
                <IconButton icon="timer-off" size={22} iconColor={theme.colors.primary} style={{ margin: 0 }} />
              </View>
              <View style={{ flex: 1, paddingLeft: 16 }}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                  Just Focus
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                  Start a session without linking to a goal
                </Text>
              </View>
              <View style={[styles.chevronContainer, { backgroundColor: theme.colors.surfaceVariant + '80' }]}>
                <IconButton icon="chevron-right" size={18} iconColor={theme.colors.onSurfaceVariant} style={{ margin: 0 }} />
              </View>
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
                 <Icon source="island" size={48} color={theme.colors.onSurfaceVariant} />
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '600', marginTop: 16 }}>
                  No goals found
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
                  {searchQuery ? 'Try ajusting your search' : "You're all caught up for today!"}
                </Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>

      {/* Duration Picker Modal */}
      <CustomDurationPicker
        visible={showDurationPicker}
        onDismiss={handleDurationPickerDismiss}
        onSelect={handleDurationSelect}
        defaultDuration={defaultDuration}
      />
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    minHeight: '60%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  dragHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(120, 120, 120, 0.3)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  searchBar: {
    marginHorizontal: 24,
    marginBottom: 24,
    elevation: 0,
    borderRadius: 16,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(120, 120, 120, 0.1)',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  noGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 32,
    borderStyle: 'solid', // changed from dashed for cleaner look
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: 0.5,
    fontSize: 13,
    paddingLeft: 4,
  },
  goalsList: {
    gap: 12,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  goalContent: {
    flex: 1,
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GoalSelectorForFocus;
