import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Button,
  useTheme,
  Text,
  Portal,
  Modal,
  IconButton,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import type { GoalFormMode } from '../navigation/types';
import type { Priority, RecurrencePattern, Goal, Subgoal, SubgoalProgress, AIGoalAnalysis, SuggestedSubgoal, ClarifiedGoal, CategorySuggestion, GoalImage, GoalSuggestion, AIGeneratedSubgoal } from '../types';
import { goalManager, subgoalManager, templateService, aiService, categoryManager, advancedAIService } from '../services';
import { useSettings } from '../context/SettingsContext';
import { useAlert } from '../context/AlertContext';
import {
  PriorityPicker,
  RecurrencePicker,
  ReminderTimePicker,
  VoiceInputButton,
  RewriteButton,
  SubgoalList,
  AIAssistantPanel,
  ImageAttachmentPicker,
  VoiceNotePlayer,
  VoiceNoteRecorder,
  DependencyPicker,
  GoalCoverImage,
  VisionBoardGrid,
  ProgressPhotoPicker,
  MoodBoardSection,
  AIGoalCoach,
  GoalBreakdownModal,
  CategoryPicker,
} from '../components';
import { ThemedIcon } from '../components/ThemedIcon';

/**
 * Form values interface for TanStack Form
 */
interface GoalFormValues {
  title: string;
  description: string;
  dueDate: Date;
  priority: Priority;
  recurrence: RecurrencePattern;
  reminderTime: string | undefined;
  imageUri: string | undefined;
  voiceNoteUri: string | undefined;
  voiceNoteDuration: number | undefined;
  dependsOn: string[];
  coverImage: string | undefined;
  progressPhotos: GoalImage[];
  moodBoardImages: GoalImage[];
  visionBoardImages: GoalImage[];
  categoryId: string | undefined;
}

const getTomorrowDate = (): Date => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
};

const DATE_OPTIONS = (() => {
  const options = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    let label;
    if (i === 0) label = 'Today';
    else if (i === 1) label = 'Tomorrow';
    else label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    options.push({ date, label, isToday: i === 0 });
  }
  return options;
})();

/**
 * Get the display label for a priority
 */
const getPriorityLabel = (priority: Priority): string => {
  const labels: Record<Priority, string> = {
    low: 'Low Priority',
    medium: 'Medium Priority',
    high: 'High Priority',
  };
  return labels[priority];
};

/**
 * Get the display label for recurrence
 */
const getRecurrenceLabel = (recurrence: RecurrencePattern): string => {
  switch (recurrence.type) {
    case 'none':
      return 'No Repeat';
    case 'daily':
      return 'Daily';
    case 'weekly':
      return 'Weekly';
    case 'custom':
      if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return recurrence.daysOfWeek.map(d => dayNames[d]).join(', ');
      }
      return 'Custom';
    default:
      return 'No Repeat';
  }
};

/**
 * Format a date as YYYY-MM-DD using local timezone (not UTC)
 * This prevents timezone issues when comparing/saving dates
 */
const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse a YYYY-MM-DD date string into a Date object using local timezone
 * This prevents timezone shifts when loading dates from storage
 */
const parseDateLocal = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Default form values for new goals
 */
const getDefaultFormValues = (): GoalFormValues => ({
  title: '',
  description: '',
  dueDate: getTomorrowDate(),
  priority: 'medium',
  recurrence: { type: 'none' },
  reminderTime: undefined,
  imageUri: undefined,
  voiceNoteUri: undefined,
  voiceNoteDuration: undefined,
  dependsOn: [],
  coverImage: undefined,
  progressPhotos: [],
  moodBoardImages: [],
  visionBoardImages: [],
  categoryId: undefined,
});

/**
 * GoalFormScreen Props
 */
interface GoalFormScreenProps {
  goalId?: string;
  mode?: GoalFormMode;
}

/**
 * GoalFormScreen - Unified screen for add, view, and edit goal modes
 * Editorial-style layout with large typography and minimal inputs.
 * Refactored to use TanStack Form for form state management.
 */
export function GoalFormScreen({ goalId, mode: propsMode }: GoalFormScreenProps) {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const alert = useAlert();
  
  // Determine if we're in add mode or viewing/editing an existing goal
  const initialMode = propsMode || (goalId ? 'view' : 'add');
  
  const [mode, setMode] = useState<GoalFormMode>(initialMode);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allGoals, setAllGoals] = useState<Goal[]>([]);

  // Voice input interim states (not part of form, just UI state)
  const [titleInterim, setTitleInterim] = useState('');
  const [descInterim, setDescInterim] = useState('');

  // Subgoal state (managed separately as they're persisted independently)
  const [subgoals, setSubgoals] = useState<Subgoal[]>([]);
  const [subgoalProgress, setSubgoalProgress] = useState<SubgoalProgress>({ completed: 0, total: 0, percentage: 0 });
  const [showMilestoneCelebration, setShowMilestoneCelebration] = useState(false);
  const [completedMilestoneName, setCompletedMilestoneName] = useState('');

  // Modal states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  // AI Assistant state
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiLoading, setAILoading] = useState(false);
  const [aiAnalysis, setAIAnalysis] = useState<AIGoalAnalysis | null>(null);
  const [aiError, setAIError] = useState<string | null>(null);
  const [addedSubgoalsFromAI, setAddedSubgoalsFromAI] = useState<Set<string>>(new Set());
  
  // Advanced AI state
  const [showAICoach, setShowAICoach] = useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);

  const isReadOnly = mode === 'view';
  const isEditing = mode === 'edit';
  const isAdding = mode === 'add';

  /**
   * TanStack Form instance for managing goal form state
   */
  const form = useForm({
    defaultValues: getDefaultFormValues() as GoalFormValues,
    onSubmit: async ({ value }) => {
      if (!value.title.trim()) return;
      setIsSubmitting(true);
      try {
        if (isAdding) {
          await goalManager.createGoal({
            title: value.title.trim(),
            description: value.description.trim() || undefined,
            dueDate: formatDateLocal(value.dueDate),
            priority: value.priority,
            recurrence: value.recurrence,
            reminderTime: value.reminderTime,
            imageUri: value.imageUri,
            voiceNoteUri: value.voiceNoteUri,
            voiceNoteDuration: value.voiceNoteDuration,
            dependsOn: value.dependsOn.length > 0 ? value.dependsOn : undefined,
            coverImage: value.coverImage,
            progressPhotos: value.progressPhotos.length > 0 ? value.progressPhotos : undefined,
            moodBoardImages: value.moodBoardImages.length > 0 ? value.moodBoardImages : undefined,
            visionBoardImages: value.visionBoardImages.length > 0 ? value.visionBoardImages : undefined,
            categoryId: value.categoryId,
          });
        } else if (isEditing && goalId) {
          await goalManager.updateGoal(goalId, {
            title: value.title.trim(),
            description: value.description.trim() || undefined,
            dueDate: formatDateLocal(value.dueDate),
            priority: value.priority,
            recurrence: value.recurrence,
            reminderTime: value.reminderTime,
            imageUri: value.imageUri,
            voiceNoteUri: value.voiceNoteUri,
            voiceNoteDuration: value.voiceNoteDuration,
            dependsOn: value.dependsOn,
            coverImage: value.coverImage,
            progressPhotos: value.progressPhotos,
            moodBoardImages: value.moodBoardImages,
            visionBoardImages: value.visionBoardImages,
            categoryId: value.categoryId,
          });
        }
        router.back();
      } catch (error) {
        console.error(error);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  /**
   * Load goal data when viewing/editing
   */
  useEffect(() => {
    // Load all goals for dependency picker
    const loadedAllGoals = goalManager.getAllGoals();
    setAllGoals(loadedAllGoals);
    
    if (goalId) {
      const loadedGoal = goalManager.getGoal(goalId);
      if (loadedGoal) {
        setGoal(loadedGoal);
        // Reset form with loaded goal values
        // Use individual setFieldValue calls to ensure values are properly updated
        form.setFieldValue('title', loadedGoal.title);
        form.setFieldValue('description', loadedGoal.description || '');
        form.setFieldValue('dueDate', parseDateLocal(loadedGoal.dueDate));
        form.setFieldValue('priority', loadedGoal.priority);
        form.setFieldValue('recurrence', loadedGoal.recurrence);
        form.setFieldValue('reminderTime', loadedGoal.reminderTime);
        form.setFieldValue('imageUri', loadedGoal.imageUri);
        form.setFieldValue('voiceNoteUri', loadedGoal.voiceNoteUri);
        form.setFieldValue('voiceNoteDuration', loadedGoal.voiceNoteDuration);
        form.setFieldValue('dependsOn', loadedGoal.dependsOn || []);
        form.setFieldValue('coverImage', loadedGoal.coverImage || loadedGoal.imageUri);
        form.setFieldValue('progressPhotos', loadedGoal.progressPhotos || []);
        form.setFieldValue('moodBoardImages', loadedGoal.moodBoardImages || []);
        form.setFieldValue('visionBoardImages', loadedGoal.visionBoardImages || []);
        form.setFieldValue('categoryId', loadedGoal.categoryId);
        
        // Load subgoals
        const loadedSubgoals = loadedGoal.subgoals || [];
        setSubgoals(loadedSubgoals);
        
        // Calculate progress
        if (loadedSubgoals.length > 0) {
          const progress = subgoalManager.calculateProgress(goalId);
          setSubgoalProgress(progress);
        }
      } else {
        // Goal not found, go back
        router.back();
      }
    }
  }, [goalId, router]);

  const handleDateSelect = (date: Date) => {
    form.setFieldValue('dueDate', date);
    setShowDatePicker(false);
  };

  /**
   * Refresh subgoals from storage
   */
  const refreshSubgoals = useCallback(() => {
    if (goalId) {
      try {
        const loadedSubgoals = subgoalManager.getSubgoals(goalId);
        setSubgoals(loadedSubgoals);
        const progress = subgoalManager.calculateProgress(goalId);
        setSubgoalProgress(progress);
      } catch (error) {
        console.error('Failed to refresh subgoals:', error);
      }
    }
  }, [goalId]);

  /**
   * Handle adding a new subgoal
   */
  const handleAddSubgoal = useCallback((title: string, isMilestone: boolean) => {
    if (!goalId) return;
    try {
      subgoalManager.createSubgoal(goalId, title, isMilestone);
      refreshSubgoals();
    } catch (error) {
      console.error('Failed to add subgoal:', error);
      alert.error('Error', 'Failed to add step. Please try again.');
    }
  }, [goalId, refreshSubgoals]);

  /**
   * Handle toggling subgoal completion
   */
  const handleToggleSubgoal = useCallback((subgoalId: string) => {
    if (!goalId) return;
    try {
      const subgoal = subgoalManager.toggleSubgoalCompletion(subgoalId, goalId);
      
      // Check if a milestone was just completed
      if (subgoal.isCompleted && subgoal.isMilestone) {
        setCompletedMilestoneName(subgoal.title);
        setShowMilestoneCelebration(true);
      }
      
      refreshSubgoals();
      
      // Check if all subgoals are complete
      if (subgoalManager.areAllSubgoalsComplete(goalId)) {
        const currentSubgoals = subgoalManager.getSubgoals(goalId);
        if (currentSubgoals.length > 0) {
          alert.confirm(
            'All Steps Complete!',
            'Would you like to mark the goal as complete?',
            async () => {
              await goalManager.toggleComplete(goalId);
              router.back();
            },
            undefined,
            'Complete Goal',
            'Not Yet'
          );
        }
      }
    } catch (error) {
      console.error('Failed to toggle subgoal:', error);
    }
  }, [goalId, refreshSubgoals, router]);

  /**
   * Handle deleting a subgoal
   */
  const handleDeleteSubgoal = useCallback((subgoalId: string) => {
    if (!goalId) return;
    try {
      subgoalManager.deleteSubgoal(subgoalId, goalId);
      refreshSubgoals();
    } catch (error) {
      console.error('Failed to delete subgoal:', error);
    }
  }, [goalId, refreshSubgoals]);

  /**
   * Handle editing a subgoal
   */
  const handleEditSubgoal = useCallback((subgoalId: string, title: string, isMilestone: boolean) => {
    if (!goalId) return;
    try {
      subgoalManager.updateSubgoal(subgoalId, goalId, { title, isMilestone });
      refreshSubgoals();
    } catch (error) {
      console.error('Failed to edit subgoal:', error);
    }
  }, [goalId, refreshSubgoals]);

  /**
   * Handle delete
   */
  const handleDelete = useCallback(() => {
    if (!goal) return;

    const isRecurring = goal.recurrence.type !== 'none' || goal.recurrence.parentGoalId;

    if (isRecurring) {
      setShowDeleteDialog(true);
    } else {
      alert.confirm(
        'Delete Goal',
        'Are you sure you want to delete this goal?',
        async () => {
          await goalManager.deleteGoal(goalId!);
          router.back();
        },
        undefined,
        'Delete',
        'Cancel',
        true
      );
    }
  }, [goal, goalId, router]);

  /**
   * Handle delete this occurrence only
   */
  const handleDeleteThisOnly = useCallback(async () => {
    setShowDeleteDialog(false);
    await goalManager.deleteGoal(goalId!);
    router.back();
  }, [goalId, router]);

  /**
   * Handle delete all occurrences
   */
  const handleDeleteAll = useCallback(async () => {
    setShowDeleteDialog(false);
    await goalManager.deleteRecurringSeries(goalId!);
    router.back();
  }, [goalId, router]);

  /**
   * Handle cancel with unsaved changes warning
   */
  const handleCancel = useCallback(() => {
    const hasChanges = form.state.isDirty;
    if (hasChanges && !isReadOnly) {
      alert.confirm(
        'Discard Changes',
        'You have unsaved changes. Are you sure you want to discard them?',
        () => router.back(),
        undefined,
        'Discard',
        'Keep Editing',
        true
      );
    } else {
      router.back();
    }
  }, [form.state.isDirty, router, isReadOnly]);

  /**
   * Switch to edit mode
   */
  const handleStartEdit = useCallback(() => {
    setMode('edit');
  }, []);

  /**
   * Handle opening save as template modal
   * Requirements: 3.6, 3.7
   */
  const handleOpenSaveTemplate = useCallback(() => {
    if (!goal) return;
    setTemplateName(goal.title);
    setTemplateDescription(goal.description || '');
    setShowSaveTemplateModal(true);
  }, [goal]);

  /**
   * Handle saving goal as template
   * Requirements: 3.7
   */
  const handleSaveAsTemplate = useCallback(() => {
    if (!goal || !templateName.trim()) return;

    try {
      templateService.saveAsTemplate(goal, templateName.trim(), templateDescription.trim());
      setShowSaveTemplateModal(false);
      setTemplateName('');
      setTemplateDescription('');
      alert.success('Success', 'Goal saved as template!');
    } catch (error: any) {
      alert.error('Error', error.message || 'Failed to save template');
    }
  }, [goal, templateName, templateDescription]);

  /**
   * Trigger AI analysis
   */
  const handleAIAnalysis = useCallback(async () => {
    const title = form.getFieldValue('title');
    const description = form.getFieldValue('description');
    
    if (!title.trim()) {
      alert.warning('Enter a goal', 'Please enter a goal title first.');
      return;
    }

    setShowAIPanel(true);
    setAILoading(true);
    setAIError(null);
    setAIAnalysis(null);

    try {
      const categories = categoryManager.getCategories();
      const existingGoals = goalManager.getAllGoals();
      const result = await aiService.analyzeGoal(title, description, categories, existingGoals);

      if (result) {
        setAIAnalysis(result);
      } else {
        setAIError('AI analysis unavailable. Check your API key in Settings.');
      }
    } catch (error) {
      setAIError('Failed to analyze goal. Please try again.');
    } finally {
      setAILoading(false);
    }
  }, [form]);

  /**
   * Apply suggested subgoal from AI
   */
  const handleApplyAISubgoal = useCallback((subgoal: SuggestedSubgoal) => {
    if (!goalId) {
      // For new goals, we can't add subgoals yet - they need to be saved first
      alert.info(
        'Save Goal First',
        'Save the goal first, then you can add the suggested steps.'
      );
      return;
    }

    try {
      subgoalManager.createSubgoal(goalId, subgoal.title, subgoal.isMilestone);
      setAddedSubgoalsFromAI(prev => new Set([...prev, subgoal.title]));
      refreshSubgoals();
    } catch (error) {
      console.error('Failed to add AI subgoal:', error);
    }
  }, [goalId, refreshSubgoals]);

  /**
   * Apply clarified goal from AI
   */
  const handleApplyClarifiedGoal = useCallback((clarified: ClarifiedGoal) => {
    form.setFieldValue('title', clarified.title);
    if (clarified.description) {
      form.setFieldValue('description', clarified.description);
    }
    setShowAIPanel(false);
  }, [form]);

  /**
   * Apply suggested category from AI
   */
  const handleApplyCategory = useCallback((category: CategorySuggestion) => {
    // Category assignment would require adding categoryId to the goal form
    // For now, just show feedback
    alert.info(
      'Category Suggestion',
      `Suggested: ${category.categoryName}\n\nCategory selection coming soon!`
    );
  }, [alert]);

  /**
   * View related goal
   */
  const handleViewRelatedGoal = useCallback((relatedGoalId: string) => {
    setShowAIPanel(false);
    router.push({ pathname: '/goal/[id]', params: { id: relatedGoalId, mode: 'view' } });
  }, [router]);

  /**
   * Handle AI Coach suggestion application
   */
  const handleApplyCoachSuggestion = useCallback((suggestion: GoalSuggestion) => {
    if (suggestion.title) form.setFieldValue('title', suggestion.title);
    if (suggestion.description) form.setFieldValue('description', suggestion.description);
    if (suggestion.priority) form.setFieldValue('priority', suggestion.priority);
    if (suggestion.dueDate) form.setFieldValue('dueDate', new Date(suggestion.dueDate));
    setShowAICoach(false);
  }, [form]);

  /**
   * Handle AI Breakdown subgoals application
   */
  const handleApplyBreakdownSubgoals = useCallback((aiSubgoals: AIGeneratedSubgoal[]) => {
    if (!goalId) {
      alert.info(
        'Save Goal First',
        'Save the goal first, then you can add the generated subgoals.'
      );
      return;
    }

    try {
      for (const subgoal of aiSubgoals) {
        subgoalManager.createSubgoal(goalId, subgoal.title, subgoal.isMilestone);
      }
      refreshSubgoals();
      alert.success('Success', `Added ${aiSubgoals.length} subgoal${aiSubgoals.length > 1 ? 's' : ''}!`);
    } catch (error) {
      console.error('Failed to add breakdown subgoals:', error);
      alert.error('Error', 'Failed to add subgoals. Please try again.');
    }
  }, [goalId, refreshSubgoals, alert]);

  /**
   * Get categories for AI components
   */
  const categories = useMemo(() => categoryManager.getCategories(), []);

  /**
   * Get header title based on mode
   */
  const headerTitle = useMemo(() => {
    switch (mode) {
      case 'add':
        return 'New Goal';
      case 'view':
        return 'Goal Details';
      case 'edit':
        return 'Edit Goal';
    }
  }, [mode]);

  /**
   * Get header action button based on mode
   * Uses form.Subscribe for reactive updates when form state changes
   */
  const renderHeaderAction = () => {
    if (isReadOnly) {
      return (
        <IconButton
          icon="pencil"
          size={24}
          iconColor={theme.colors.primary}
          onPress={handleStartEdit}
        />
      );
    }
    
    // Use form.Subscribe to reactively track isDirty and values changes
    return (
      <form.Subscribe
        selector={(state) => ({
          isDirty: state.isDirty,
          title: state.values.title,
        })}
        children={({ isDirty, title }) => (
          <IconButton
            icon="check"
            size={28}
            iconColor={theme.colors.primary}
            disabled={!title?.trim() || isSubmitting || (isEditing && !isDirty)}
            onPress={() => form.handleSubmit()}
          />
        )}
      />
    );
  };

  // Subscribe to form values for display
  const formValues = form.state.values;
  const displayDate = formValues.dueDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const isRecurring = formValues.recurrence.type !== 'none' || formValues.recurrence.parentGoalId;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Editorial Header */}
      <View style={[styles.header, { paddingTop: insets.top - 12 }]}>
        <IconButton 
          icon="close" 
          size={28} 
          iconColor={theme.colors.onSurface} 
          onPress={handleCancel}
          style={{ marginLeft: -8 }}
        />
        <Text variant="titleMedium" style={{ fontWeight: '600', opacity: 0.5 }}>{headerTitle}</Text>
        {renderHeaderAction()}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Completion Status Badge (for view/edit modes) */}
          {goal && (
            <View style={[
              styles.statusBadge, 
              { 
                backgroundColor: goal.isCompleted 
                  ? theme.colors.primaryContainer 
                  : theme.colors.surfaceVariant
              }
            ]}>
              <ThemedIcon 
                name={goal.isCompleted ? 'check-circle' : 'clock-outline'} 
                size={18} 
                color={goal.isCompleted ? theme.colors.primary : theme.colors.onSurfaceVariant} 
              />
              <Text 
                variant="labelMedium" 
                style={{ 
                  color: goal.isCompleted ? theme.colors.primary : theme.colors.onSurfaceVariant,
                  marginLeft: 8,
                  fontWeight: '600',
                }}
              >
                {goal.isCompleted ? 'Completed' : 'In Progress'}
              </Text>
              {goal.completedAt && (
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}>
                  {new Date(goal.completedAt).toLocaleDateString()}
                </Text>
              )}
            </View>
          )}

          {/* Recurring indicator */}
          {isRecurring && (
            <View style={[styles.recurringBadge, { backgroundColor: theme.colors.secondaryContainer }]}>
              <ThemedIcon name="repeat" size={16} themeColor="secondary" />
              <Text variant="labelMedium" style={{ color: theme.colors.secondary, marginLeft: 8 }}>
                Recurring Goal
              </Text>
            </View>
          )}

          {/* Title Input / Display */}
          {isReadOnly ? (
            <Text style={[styles.titleDisplay, { color: theme.colors.onSurface }]}>
              {formValues.title}
            </Text>
          ) : (
            <View>
              <form.Field
                name="title"
                children={(field) => (
                  <View style={styles.inputWithVoice}>
                    <TextInput
                      value={field.state.value}
                      onChangeText={field.handleChange}
                      onBlur={field.handleBlur}
                      placeholder="I want to..."
                      placeholderTextColor={theme.colors.outline}
                      style={[styles.titleInput, styles.inputFlex, { color: theme.colors.onSurface }]}
                      multiline
                      maxLength={200}
                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                      selectionColor={theme.colors.primary}
                      theme={{ colors: { background: 'transparent' } }}
                      editable={!isReadOnly}
                    />
                    <VoiceInputButton
                      onTranscript={(text) => {
                        field.handleChange(field.state.value ? `${field.state.value} ${text}` : text);
                        setTitleInterim('');
                      }}
                      onInterimTranscript={setTitleInterim}
                      size={22}
                    />
                    <RewriteButton
                      text={field.state.value}
                      type="title"
                      context={form.getFieldValue('description')}
                      onRewrite={field.handleChange}
                      size={20}
                      isConfigured={!!settings.openRouterApiKey}
                    />
                  </View>
                )}
              />
              {titleInterim ? (
                <Text style={[styles.interimText, { color: theme.colors.tertiary }]}>
                  {titleInterim}
                </Text>
              ) : null}
            </View>
          )}

          {/* Description Input / Display */}
          {isReadOnly ? (
            formValues.description ? (
              <Text style={[styles.descDisplay, { color: theme.colors.onSurfaceVariant }]}>
                {formValues.description}
              </Text>
            ) : null
          ) : (
            <View>
              <form.Field
                name="description"
                children={(field) => (
                  <View style={styles.inputWithVoice}>
                    <TextInput
                      value={field.state.value}
                      onChangeText={field.handleChange}
                      onBlur={field.handleBlur}
                      placeholder="Add details, motivation, or notes..."
                      placeholderTextColor={theme.colors.outline}
                      style={[styles.descInput, styles.inputFlex, { color: theme.colors.onSurfaceVariant }]}
                      multiline
                      maxLength={1000}
                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                      selectionColor={theme.colors.primary}
                      theme={{ colors: { background: 'transparent' } }}
                      editable={!isReadOnly}
                    />
                    <VoiceInputButton
                      onTranscript={(text) => {
                        field.handleChange(field.state.value ? `${field.state.value} ${text}` : text);
                        setDescInterim('');
                      }}
                      onInterimTranscript={setDescInterim}
                      size={22}
                    />
                    <RewriteButton
                      text={field.state.value}
                      type="description"
                      context={form.getFieldValue('title')}
                      onRewrite={field.handleChange}
                      size={20}
                      isConfigured={!!settings.openRouterApiKey}
                    />
                  </View>
                )}
              />
              {descInterim ? (
                <Text style={[styles.interimText, { color: theme.colors.tertiary }]}>
                  {descInterim}
                </Text>
              ) : null}
            </View>
          )}

          {/* AI Assist Buttons - Only show in add/edit modes when AI is configured */}
          {!isReadOnly && settings.openRouterApiKey && (
            <View style={styles.aiButtonsRow}>
              <TouchableOpacity
                onPress={handleAIAnalysis}
                disabled={aiLoading}
                style={[styles.aiAssistButton, { backgroundColor: theme.colors.primaryContainer, flex: 1 }]}
                activeOpacity={0.7}
              >
                <ThemedIcon name="auto-fix" size={18} themeColor="primary" />
                <Text variant="labelLarge" style={{ color: theme.colors.primary, marginLeft: 8, fontWeight: '600' }}>
                  AI Assist
                </Text>
              </TouchableOpacity>
              
              {settings.aiGoalCoachEnabled && (
                <TouchableOpacity
                  onPress={() => setShowAICoach(true)}
                  style={[styles.aiAssistButton, { backgroundColor: theme.colors.secondaryContainer, flex: 1, marginLeft: 8 }]}
                  activeOpacity={0.7}
                >
                  <ThemedIcon name="robot-happy" size={18} themeColor="secondary" />
                  <Text variant="labelLarge" style={{ color: theme.colors.secondary, marginLeft: 8, fontWeight: '600' }}>
                    Coach
                  </Text>
                </TouchableOpacity>
              )}
              
              {settings.aiGoalBreakdownEnabled && goalId && (
                <TouchableOpacity
                  onPress={() => setShowBreakdownModal(true)}
                  style={[styles.aiAssistButton, { backgroundColor: theme.colors.tertiaryContainer, flex: 1, marginLeft: 8 }]}
                  activeOpacity={0.7}
                >
                  <ThemedIcon name="puzzle-outline" size={18} themeColor="tertiary" />
                  <Text variant="labelLarge" style={{ color: theme.colors.tertiary, marginLeft: 8, fontWeight: '600' }}>
                    Break Down
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* AI Assistant Panel */}
          <AIAssistantPanel
            visible={showAIPanel}
            loading={aiLoading}
            analysis={aiAnalysis}
            error={aiError}
            onAddSubgoal={handleApplyAISubgoal}
            onApplyClarifiedGoal={handleApplyClarifiedGoal}
            onApplyCategory={handleApplyCategory}
            onViewRelatedGoal={handleViewRelatedGoal}
            onDismiss={() => setShowAIPanel(false)}
            addedSubgoals={addedSubgoalsFromAI}
          />

          <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

          {/* Date Section */}
          {isReadOnly ? (
            <View style={[styles.infoRow, { backgroundColor: theme.colors.surfaceVariant }]}>
              <View style={styles.infoLabelRow}>
                <ThemedIcon name="calendar-month-outline" size={24} themeColor="primary" />
                <View>
                  <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 2 }}>DUE DATE</Text>
                  <Text variant="titleMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>{displayDate}</Text>
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
              style={[styles.dateRow, { backgroundColor: theme.colors.surfaceVariant }]}
            >
              <View style={styles.dateLabelRow}>
                <ThemedIcon name="calendar-month-outline" size={24} themeColor="primary" />
                <View>
                  <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 2 }}>DUE DATE</Text>
                  <Text variant="titleMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>{displayDate}</Text>
                </View>
              </View>
              <ThemedIcon name="chevron-right" size={24} themeColor="onSurfaceVariant" />
            </TouchableOpacity>
          )}

          {/* Priority Section */}
          {isReadOnly ? (
            <View style={[styles.infoRow, { backgroundColor: theme.colors.surfaceVariant }]}>
              <View style={styles.infoLabelRow}>
                <ThemedIcon name="flag-outline" size={24} themeColor="primary" />
                <View>
                  <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 2 }}>PRIORITY</Text>
                  <Text variant="titleMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>{getPriorityLabel(formValues.priority)}</Text>
                </View>
              </View>
            </View>
          ) : (
            <form.Field
              name="priority"
              children={(field) => (
                <PriorityPicker value={field.state.value} onChange={field.handleChange} />
              )}
            />
          )}
          


          {/* Category Section */}
          <form.Field
            name="categoryId"
            children={(field) => (
              <CategoryPicker 
                value={field.state.value} 
                onChange={field.handleChange} 
                disabled={isReadOnly}
              />
            )}
          />
          
          {/* Recurrence Section */}
          {isReadOnly ? (
            <View style={[styles.infoRow, { backgroundColor: theme.colors.surfaceVariant }]}>
              <View style={styles.infoLabelRow}>
                <ThemedIcon name="repeat" size={24} themeColor="primary" />
                <View>
                  <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 2 }}>REPEAT</Text>
                  <Text variant="titleMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>{getRecurrenceLabel(formValues.recurrence)}</Text>
                </View>
              </View>
            </View>
          ) : (
            <form.Field
              name="recurrence"
              children={(field) => (
                <RecurrencePicker value={field.state.value} onChange={field.handleChange} />
              )}
            />
          )}
          
          {/* Reminder Section */}
          {isReadOnly ? (
            formValues.reminderTime && (
              <View style={[styles.infoRow, { backgroundColor: theme.colors.surfaceVariant }]}>
                <View style={styles.infoLabelRow}>
                  <ThemedIcon name="bell-outline" size={24} themeColor="primary" />
                  <View>
                    <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 2 }}>REMINDER</Text>
                    <Text variant="titleMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                      {new Date(formValues.reminderTime).toLocaleString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            )
          ) : (
            <form.Field
              name="reminderTime"
              children={(field) => (
                <ReminderTimePicker 
                  value={field.state.value} 
                  onChange={field.handleChange} 
                  goalDueDate={formatDateLocal(formValues.dueDate)}
                  goalTitle={formValues.title}
                  goalDescription={formValues.description}
                />
              )}
            />
          )}

          {/* Dependencies Section */}
          <form.Field
            name="dependsOn"
            children={(field) => (
              <DependencyPicker
                selectedIds={field.state.value}
                onChange={field.handleChange}
                availableGoals={allGoals}
                currentGoalId={goalId}
                disabled={isReadOnly}
                label="PREREQUISITES"
              />
            )}
          />

          {/* Image Attachment Section */}
          <form.Field
            name="imageUri"
            children={(field) => (
              <ImageAttachmentPicker
                value={field.state.value}
                onChange={field.handleChange}
                disabled={isReadOnly}
              />
            )}
          />

          {/* Voice Note Section */}
          <View style={{ marginTop: 24, paddingHorizontal: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <ThemedIcon name="microphone" size={20} themeColor="primary" />
              <Text variant="labelLarge" style={{ marginLeft: 8, color: theme.colors.onSurfaceVariant, fontWeight: '600' }}>
                VOICE NOTE
              </Text>
            </View>

            <form.Field
              name="voiceNoteUri"
              children={(field) => (
                <>
                  {field.state.value ? (
                    <VoiceNotePlayer
                      uri={field.state.value}
                      duration={formValues.voiceNoteDuration || 0}
                      onDelete={isReadOnly ? undefined : () => {
                        field.handleChange(undefined);
                        form.setFieldValue('voiceNoteDuration', undefined);
                      }}
                    />
                  ) : (
                    !isReadOnly && (
                      <VoiceNoteRecorder
                        onRecordingComplete={(uri, duration) => {
                          field.handleChange(uri);
                          form.setFieldValue('voiceNoteDuration', duration);
                        }}
                        onCancel={() => {}}
                      />
                    )
                  )}
                </>
              )}
            />
            
            {isReadOnly && !formValues.voiceNoteUri && (
              <Text style={{ color: theme.colors.outline, fontStyle: 'italic', marginLeft: 8 }}>
                No voice note attached
              </Text>
            )}
          </View>

          {/* Rich Media Section */}
          <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
          
          {/* Cover Image */}
          {goalId && (
            <form.Field
              name="coverImage"
              children={(field) => (
                <GoalCoverImage
                  value={field.state.value}
                  onChange={field.handleChange}
                  goalId={goalId}
                  disabled={isReadOnly}
                />
              )}
            />
          )}

          {/* Vision Board - Only for existing goals */}
          {goalId && (
            <form.Field
              name="visionBoardImages"
              children={(field) => (
                <VisionBoardGrid
                  goalId={goalId}
                  images={field.state.value}
                  onImagesChange={field.handleChange}
                  disabled={isReadOnly}
                />
              )}
            />
          )}

          {/* Progress Photos - Only for existing goals */}
          {goalId && (
            <form.Field
              name="progressPhotos"
              children={(field) => (
                <ProgressPhotoPicker
                  goalId={goalId}
                  photos={field.state.value}
                  onPhotosChange={field.handleChange}
                  disabled={isReadOnly}
                />
              )}
            />
          )}

          {/* Mood Board - Only for existing goals */}
          {goalId && (
            <form.Field
              name="moodBoardImages"
              children={(field) => (
                <MoodBoardSection
                  goalId={goalId}
                  images={field.state.value}
                  onImagesChange={field.handleChange}
                  disabled={isReadOnly}
                />
              )}
            />
          )}

          {/* Subgoals Section - Only show for existing goals */}
          {goalId && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
              <SubgoalList
                subgoals={subgoals}
                progress={subgoalProgress}
                onToggleComplete={handleToggleSubgoal}
                onAdd={handleAddSubgoal}
                onDelete={handleDeleteSubgoal}
                onEdit={handleEditSubgoal}
                disabled={isReadOnly}
                showAddInput={!isReadOnly}
              />
            </>
          )}

          {/* Delete Button (for view/edit modes) */}
          {goal && !isAdding && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
              
              {/* Save as Template Button - Requirements: 3.6, 3.7 */}
              {subgoals.length > 0 && (
                <TouchableOpacity
                  onPress={handleOpenSaveTemplate}
                  style={[styles.saveTemplateButton, { backgroundColor: theme.colors.primaryContainer }]}
                  activeOpacity={0.7}
                >
                  <ThemedIcon name="file-document-outline" size={20} themeColor="primary" />
                  <Text style={{ color: theme.colors.primary, fontWeight: '600', marginLeft: 8 }}>
                    Save as Template
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                onPress={handleDelete}
                style={[styles.deleteButton, { borderColor: theme.colors.error + '40' }]}
                activeOpacity={0.7}
              >
                <ThemedIcon name="delete-outline" size={20} themeColor="error" />
                <Text style={{ color: theme.colors.error, fontWeight: '600', marginLeft: 8 }}>
                  Delete Goal
                </Text>
              </TouchableOpacity>
            </>
          )}
          
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      <Portal>
        <Modal
          visible={showDatePicker}
          onDismiss={() => setShowDatePicker(false)}
          contentContainerStyle={[
            styles.modalContent,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>When is this due?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
            {DATE_OPTIONS.map((option, index) => {
              const isSelected = formValues.dueDate.toDateString() === option.date.toDateString();
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleDateSelect(option.date)}
                  style={[
                    styles.dateCard,
                    {
                      backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceVariant,
                    }
                  ]}
                >
                  <Text style={[styles.dateCardTitle, { color: isSelected ? theme.colors.onPrimary : theme.colors.onSurface }]}>
                    {option.label}
                  </Text>
                  <Text style={{ color: isSelected ? theme.colors.onPrimary : theme.colors.onSurfaceVariant, opacity: 0.8 }}>
                    {option.date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <Button mode="text" onPress={() => setShowDatePicker(false)} style={{ marginTop: 24 }}>Cancel</Button>
        </Modal>
      </Portal>

      {/* Delete Dialog for Recurring Goals */}
      <Portal>
        <Modal
          visible={showDeleteDialog}
          onDismiss={() => setShowDeleteDialog(false)}
          contentContainerStyle={[
            styles.deleteModal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text
            variant="titleMedium"
            style={[styles.deleteModalTitle, { color: theme.colors.onSurface }]}
          >
            Delete Recurring Goal
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.deleteModalText, { color: theme.colors.onSurfaceVariant }]}
          >
            This is a recurring goal. What would you like to delete?
          </Text>
          <View style={styles.deleteModalButtons}>
            <Button
              mode="outlined"
              onPress={handleDeleteThisOnly}
              style={styles.deleteModalButton}
            >
              This occurrence only
            </Button>
            <Button
              mode="contained"
              onPress={handleDeleteAll}
              style={styles.deleteModalButton}
              buttonColor={theme.colors.error}
            >
              All occurrences
            </Button>
            <Button
              mode="text"
              onPress={() => setShowDeleteDialog(false)}
              style={styles.deleteModalButton}
            >
              Cancel
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Milestone Celebration Modal */}
      <Portal>
        <Modal
          visible={showMilestoneCelebration}
          onDismiss={() => setShowMilestoneCelebration(false)}
          contentContainerStyle={[
            styles.milestoneModal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.milestoneContent}>
            <ThemedIcon name="trophy" size={48} color={theme.colors.onTertiaryContainer} />
            <Text
              variant="headlineSmall"
              style={[styles.milestoneTitle, { color: theme.colors.primary }]}
            >
              Milestone Reached!
            </Text>
            <Text
              variant="bodyLarge"
              style={[styles.milestoneMessage, { color: theme.colors.onSurface }]}
            >
              {completedMilestoneName}
            </Text>
            <Button
              mode="contained"
              onPress={() => setShowMilestoneCelebration(false)}
              style={styles.milestoneButton}
            >
              Keep Going!
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Save as Template Modal - Requirements: 3.6, 3.7 */}
      <Portal>
        <Modal
          visible={showSaveTemplateModal}
          onDismiss={() => {
            setShowSaveTemplateModal(false);
            setTemplateName('');
            setTemplateDescription('');
          }}
          contentContainerStyle={[
            styles.saveTemplateModal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text
            variant="titleMedium"
            style={[styles.saveTemplateTitle, { color: theme.colors.onSurface }]}
          >
            Save as Template
          </Text>
          <Text
            variant="bodySmall"
            style={[styles.saveTemplateSubtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Create a reusable template from this goal
          </Text>
          <TextInput
            label="Template Name"
            value={templateName}
            onChangeText={setTemplateName}
            style={styles.saveTemplateInput}
            mode="outlined"
            maxLength={100}
          />
          <TextInput
            label="Description (optional)"
            value={templateDescription}
            onChangeText={setTemplateDescription}
            style={styles.saveTemplateInput}
            mode="outlined"
            multiline
            numberOfLines={3}
            maxLength={500}
          />
          <View style={styles.saveTemplateInfo}>
            <ThemedIcon name="information-outline" size={16} themeColor="onSurfaceVariant" />
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, flex: 1, marginLeft: 8 }}
            >
              This template will include {subgoals.length} step{subgoals.length !== 1 ? 's' : ''} from this goal.
            </Text>
          </View>
          <View style={styles.saveTemplateActions}>
            <Button
              mode="outlined"
              onPress={() => {
                setShowSaveTemplateModal(false);
                setTemplateName('');
                setTemplateDescription('');
              }}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSaveAsTemplate}
              disabled={!templateName.trim()}
            >
              Save Template
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* AI Goal Coach Modal */}
      <AIGoalCoach
        visible={showAICoach}
        onDismiss={() => setShowAICoach(false)}
        onApplySuggestion={handleApplyCoachSuggestion}
        categories={categories}
      />

      {/* AI Goal Breakdown Modal */}
      <GoalBreakdownModal
        visible={showBreakdownModal}
        goal={goal}
        categories={categories}
        onDismiss={() => setShowBreakdownModal(false)}
        onApplySubgoals={handleApplyBreakdownSubgoals}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  content: {
    paddingHorizontal: 24,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  inputWithVoice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  inputFlex: {
    flex: 1,
  },
  titleInput: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    marginBottom: 8,
  },
  titleDisplay: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
    marginBottom: 8,
  },
  descInput: {
    fontSize: 18,
    lineHeight: 28,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    minHeight: 80,
  },
  descDisplay: {
    fontSize: 18,
    lineHeight: 28,
    marginBottom: 8,
  },
  interimText: {
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 8,
    paddingLeft: 4,
  },
  divider: {
    height: 1,
    marginVertical: 24,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  dateLabelRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  infoLabelRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  modalContent: {
    margin: 20,
    padding: 24,
    borderRadius: 24,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '700',
  },
  dateScroll: {
    gap: 12,
    paddingHorizontal: 4,
  },
  dateCard: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 80,
  },
  dateCardTitle: {
    fontWeight: '600',
    marginBottom: 4,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  deleteModal: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
  },
  deleteModalTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  deleteModalText: {
    marginBottom: 24,
  },
  deleteModalButtons: {
    gap: 12,
  },
  deleteModalButton: {
    borderRadius: 24,
  },
  milestoneModal: {
    margin: 20,
    borderRadius: 24,
    overflow: 'hidden',
  },
  milestoneContent: {
    padding: 32,
    alignItems: 'center',
  },
  milestoneEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  milestoneTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  milestoneMessage: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  milestoneButton: {
    borderRadius: 24,
    minWidth: 150,
  },
  saveTemplateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  saveTemplateModal: {
    margin: 20,
    padding: 24,
    borderRadius: 20,
  },
  saveTemplateTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  saveTemplateSubtitle: {
    marginBottom: 20,
  },
  saveTemplateInput: {
    marginBottom: 12,
  },
  saveTemplateInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  saveTemplateActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  aiButtonsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  aiAssistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
});

export default GoalFormScreen;
