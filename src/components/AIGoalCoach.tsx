/**
 * AIGoalCoach - Conversational goal-setting assistant
 * Bottom sheet modal with chat interface for AI-guided goal creation
 */
import React, { memo, useCallback, useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  Surface,
  IconButton,
  Button,
  Chip,
  Portal,
  Modal,
  ActivityIndicator,
} from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import Animated, { FadeIn, FadeInUp, SlideInRight } from 'react-native-reanimated';
import { ThemedIcon } from './ThemedIcon';
import { advancedAIService } from '../services/advancedAIService';
import type { CoachMessage, GoalSuggestion } from '../types/advancedAITypes';
import type { Category } from '../types';

interface AIGoalCoachProps {
  visible: boolean;
  onDismiss: () => void;
  onApplySuggestion: (suggestion: GoalSuggestion) => void;
  categories: Category[];
}

/**
 * Single message bubble component
 */
const MessageBubble = memo(({
  message,
  onApplySuggestion,
}: {
  message: CoachMessage;
  onApplySuggestion: (suggestion: GoalSuggestion) => void;
}) => {
  const theme = useTheme();
  const isUser = message.role === 'user';

  return (
    <Animated.View
      entering={isUser ? SlideInRight.duration(200) : FadeInUp.duration(300)}
      style={[
        styles.messageBubble,
        isUser
          ? { backgroundColor: theme.colors.primary, alignSelf: 'flex-end' }
          : { backgroundColor: theme.colors.surfaceVariant, alignSelf: 'flex-start' },
      ]}
    >
      <Text
        variant="bodyMedium"
        style={{ color: isUser ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }}
      >
        {message.content}
      </Text>

      {/* Goal Suggestions */}
      {message.suggestions && message.suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {message.suggestions.map((suggestion, index) => (
            <Surface
              key={index}
              style={[styles.suggestionCard, { backgroundColor: theme.colors.surface }]}
              elevation={1}
            >
              <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
                {suggestion.title}
              </Text>
              {suggestion.description && (
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
                  numberOfLines={2}
                >
                  {suggestion.description}
                </Text>
              )}
              <View style={styles.suggestionMeta}>
                {suggestion.priority && (
                  <Chip
                    compact
                    style={{ marginRight: 8 }}
                    textStyle={{ fontSize: 10 }}
                  >
                    {suggestion.priority}
                  </Chip>
                )}
                {suggestion.dueDate && (
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Due: {suggestion.dueDate}
                  </Text>
                )}
              </View>
              <Button
                mode="contained"
                compact
                onPress={() => onApplySuggestion(suggestion)}
                style={styles.applyButton}
              >
                Use This Goal
              </Button>
            </Surface>
          ))}
        </View>
      )}
    </Animated.View>
  );
});

/**
 * Typing indicator
 */
const TypingIndicator = memo(() => {
  const theme = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={[styles.typingIndicator, { backgroundColor: theme.colors.surfaceVariant }]}
    >
      <ActivityIndicator size="small" color={theme.colors.primary} />
      <Text
        variant="bodySmall"
        style={{ marginLeft: 8, color: theme.colors.onSurfaceVariant }}
      >
        AI Coach is thinking...
      </Text>
    </Animated.View>
  );
});

/**
 * Quick action chips
 */
const QuickActions = memo(({
  onSelect,
}: {
  onSelect: (action: string) => void;
}) => {
  const theme = useTheme();
  const actions = [
    'I want to be more productive',
    'Help me with fitness goals',
    'I want to learn something new',
    'Personal development ideas',
  ];

  return (
    <View style={styles.quickActions}>
      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
        Quick starts:
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {actions.map((action) => (
          <Chip
            key={action}
            onPress={() => onSelect(action)}
            style={styles.quickActionChip}
            compact
          >
            {action}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );
});

/**
 * Main AIGoalCoach Component
 */
export const AIGoalCoach: React.FC<AIGoalCoachProps> = memo(({
  visible,
  onDismiss,
  onApplySuggestion,
  categories,
}) => {
  const theme = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Start conversation when modal opens
  useEffect(() => {
    if (visible && !hasStarted) {
      startConversation();
    }
  }, [visible, hasStarted]);

  // Reset when modal closes
  useEffect(() => {
    if (!visible) {
      setMessages([]);
      setInputText('');
      setHasStarted(false);
    }
  }, [visible]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const startConversation = async () => {
    setIsLoading(true);
    setHasStarted(true);

    const response = await advancedAIService.startCoachConversation();
    
    if (response) {
      setMessages([response]);
    } else {
      setMessages([{
        id: 'error',
        role: 'assistant',
        content: 'Hi! I\'m your AI Goal Coach. Tell me what you\'d like to achieve, and I\'ll help you create specific, actionable goals.',
        timestamp: new Date().toISOString(),
      }]);
    }
    
    setIsLoading(false);
  };

  const sendMessage = useCallback(async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isLoading) return;

    // Add user message
    const userMessage: CoachMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Get AI response
    const response = await advancedAIService.continueCoachConversation(
      [...messages, userMessage],
      messageText,
      categories
    );

    if (response) {
      setMessages((prev) => [...prev, response]);
    }
    
    setIsLoading(false);
  }, [inputText, messages, categories, isLoading]);

  const handleApplySuggestion = useCallback((suggestion: GoalSuggestion) => {
    onApplySuggestion(suggestion);
    onDismiss();
  }, [onApplySuggestion, onDismiss]);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.outlineVariant }]}>
            <View style={styles.headerLeft}>
              <ThemedIcon name="robot-happy" size={24} themeColor="primary" />
              <Text variant="titleMedium" style={{ marginLeft: 8 }}>
                AI Goal Coach
              </Text>
            </View>
            <IconButton icon="close" onPress={onDismiss} size={20} />
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onApplySuggestion={handleApplySuggestion}
              />
            ))}
            {isLoading && <TypingIndicator />}
          </ScrollView>

          {/* Quick Actions (show only at start) */}
          {messages.length <= 1 && !isLoading && (
            <QuickActions onSelect={(action) => sendMessage(action)} />
          )}

          {/* Input Area */}
          <View style={[styles.inputContainer, { borderTopColor: theme.colors.outlineVariant }]}>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  color: theme.colors.onSurface,
                },
              ]}
              placeholder="Tell me what you want to achieve..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => sendMessage()}
              returnKeyType="send"
              multiline
              maxLength={500}
            />
            <IconButton
              icon="send"
              mode="contained"
              onPress={() => sendMessage()}
              disabled={!inputText.trim() || isLoading}
              style={styles.sendButton}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
});

const styles = StyleSheet.create({
  modalContainer: {
    margin: 16,
    borderRadius: 16,
    height: '80%',
    overflow: 'hidden',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  suggestionsContainer: {
    marginTop: 12,
  },
  suggestionCard: {
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  suggestionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  applyButton: {
    marginTop: 12,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  quickActions: {
    padding: 16,
    paddingTop: 8,
  },
  quickActionChip: {
    marginRight: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 8,
  },
});

export default AIGoalCoach;
