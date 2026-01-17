import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Animated } from 'react-native';
import { Text, useTheme, Button, IconButton, TextInput, Portal, Surface, Modal as PaperModal } from 'react-native-paper';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { ThemedIcon } from './ThemedIcon';
import { voiceParserService } from '../services/voiceParserService';
import { ParsedVoiceGoal } from '../types/voiceGoal';
import { Goal, Priority, RecurrencePattern } from '../types';
import { PriorityPicker } from './PriorityPicker';
import { CategoryPicker } from './CategoryPicker';
import { RecurrencePicker } from './RecurrencePicker';

interface VoiceGoalCreatorProps {
  visible: boolean;
  onDismiss: () => void;
  onGoalCreated: (goal: any) => void;
}

// Number of bars in the visualizer
const NUM_BARS = 7;
// Volume range from expo-speech-recognition is -2 to 10
const MIN_VOLUME = -2;
const MAX_VOLUME = 10;

const getTomorrowDate = (): Date => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
};



type EditableGoalValues = {
  title: string;
  description: string;
  dueDate: Date;
  priority: Priority;
  recurrence: RecurrencePattern;
  categoryId?: string;
  confidence: number;
};

export const VoiceGoalCreator: React.FC<VoiceGoalCreatorProps> = ({
  visible,
  onDismiss,
  onGoalCreated,
}) => {
  const theme = useTheme();
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedGoal, setParsedGoal] = useState<ParsedVoiceGoal | null>(null);
  const [editingValues, setEditingValues] = useState<EditableGoalValues | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Animation refs for audio visualization
  const barAnims = useRef<Animated.Value[]>(
    Array.from({ length: NUM_BARS }, () => new Animated.Value(0.15))
  ).current;
  
  // Pulse animation for the outer ring
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Refresh date options when visible changes
  const dateOptions = React.useMemo(() => {
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
  }, [visible]);

  // Reset state when visible changes
  useEffect(() => {
    if (visible) {
      setTranscript('');
      setInterimTranscript('');
      setParsedGoal(null);
      setEditingValues(null);
      setError(null);
      startListening();
    } else {
      stopListening();
    }
  }, [visible]);

  const startListening = async () => {
    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        setError('Microphone permission denied');
        return;
      }

      setIsListening(true);
      setError(null);
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: true, // Don't auto-stop - let user decide when they're done
        volumeChangeEventOptions: {
          enabled: true,
          intervalMillis: 100, // Get volume updates every 100ms for smooth visualization
        },
      });
    } catch (err) {
      console.error('Failed to start speech recognition', err);
      setError('Failed to start microphone');
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
        if (isListening) {
            await ExpoSpeechRecognitionModule.stop();
        }
    } catch (err) {
        console.warn('Error stopping speech recognition', err);
    }
    setIsListening(false);
    // Reset visualizer bars
    barAnims.forEach(anim => anim.setValue(0.15));
  };

  // Handle manual completion by user
  const handleDone = useCallback(() => {
    const currentTranscript = transcript || interimTranscript;
    if (currentTranscript.trim()) {
      stopListening();
      processTranscript(currentTranscript);
    }
  }, [transcript, interimTranscript]);

  useSpeechRecognitionEvent('start', () => setIsListening(true));
  
  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    // Reset visualizer
    barAnims.forEach(anim => anim.setValue(0.15));
  });
  
  // Volume change event for realtime visualization
  useSpeechRecognitionEvent('volumechange', (event) => {
    if (!isListening) return;
    
    // Normalize volume from [-2, 10] to [0, 1]
    const normalizedVolume = Math.max(0, Math.min(1, (event.value - MIN_VOLUME) / (MAX_VOLUME - MIN_VOLUME)));
    
    // Update each bar with slightly different values for wave effect
    barAnims.forEach((anim, index) => {
      // Create a wave pattern - bars in the middle are taller
      const centerIndex = (NUM_BARS - 1) / 2;
      const distanceFromCenter = Math.abs(index - centerIndex) / centerIndex;
      const waveMultiplier = 1 - (distanceFromCenter * 0.4);
      
      // Add some randomness for natural feel
      const randomVariation = 0.9 + Math.random() * 0.2;
      
      // Base height + volume-based height
      const targetHeight = 0.15 + (normalizedVolume * 0.85 * waveMultiplier * randomVariation);
      
      Animated.timing(anim, {
        toValue: targetHeight,
        duration: 80,
        useNativeDriver: true,
      }).start();
    });
    
    // Pulse the outer ring when volume is detected
    if (normalizedVolume > 0.1) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05 + normalizedVolume * 0.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  });
  
  useSpeechRecognitionEvent('result', (event) => {
    if (event.results && event.results.length > 0) {
      const result = event.results[0];
      if (result?.transcript) {
          if (event.isFinal) {
            // Accumulate final results for continuous mode
            setTranscript(prev => {
              const newTranscript = prev ? `${prev} ${result.transcript}` : result.transcript;
              return newTranscript;
            });
            setInterimTranscript('');
          } else {
            setInterimTranscript(result.transcript);
          }
      }
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
      console.warn('Speech error:', event);
      if (isListening) { // Only set error if we were trying to listen
          const errorMsg = typeof event.error === 'object' ? (event.error as any)?.message : String(event.error);
          setError(errorMsg || 'Speech recognition failed');
          setIsListening(false);
      }
  });

  const processTranscript = async (text: string) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    try {
      const result = await voiceParserService.parseVoiceCommand(text);
      if (result) {
        setParsedGoal(result);
        
        // Initialize editing values
        const initialDate = result.dueDate 
            ? new Date(result.dueDate) 
            : new Date(); // Default to today if parsed date is invalid/missing
            
        // Validate date
        if (isNaN(initialDate.getTime())) {
            initialDate.setTime(Date.now());
        }

        setEditingValues({
            title: result.title,
            description: result.description || '',
            dueDate: initialDate,
            priority: result.priority || 'medium',
            recurrence: { type: result.recurrence || 'none' },
            categoryId: result.categoryId,
            confidence: result.confidence
        });
      } else {
        setError('Could not understand command');
      }
    } catch (err) {
      setError('Failed to process command');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreate = () => {
    if (editingValues) {
      // Format date manually to avoid UTC conversion issues (off-by-one error)
      const d = editingValues.dueDate;
      const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      const goalData = {
        title: editingValues.title,
        description: editingValues.description,
        dueDate: formattedDate,
        priority: editingValues.priority,
        recurrence: editingValues.recurrence,
        categoryId: editingValues.categoryId,
      };
      onGoalCreated(goalData);
      onDismiss();
    }
  };

  const handleRetry = () => {
    setParsedGoal(null);
    setEditingValues(null);
    setTranscript('');
    setInterimTranscript('');
    startListening();
  };

  // Render the audio visualization bars
  const renderVisualizer = () => {
    return (
      <View style={styles.visualizerContainer}>
        {barAnims.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.visualizerBar,
              {
                backgroundColor: theme.colors.primary,
                transform: [{ scaleY: anim }],
              },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <Portal>
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity 
             style={styles.closeButton} 
             onPress={onDismiss}
          >
             <ThemedIcon name="close" size={24} themeColor="onSurface" />
          </TouchableOpacity>

          <Text variant="titleLarge" style={{ textAlign: 'center', marginBottom: 24, fontWeight: 'bold', color: theme.colors.onSurface }}>
            Voice Goal
          </Text>

          {!parsedGoal ? (
            <View style={styles.listeningState}>
              {/* Animated outer ring */}
              <Animated.View 
                style={[
                  styles.pulseRing,
                  {
                    borderColor: isListening ? theme.colors.primary : 'transparent',
                    transform: [{ scale: pulseAnim }],
                  }
                ]}
              >
                <View style={[
                    styles.micContainer, 
                    { 
                        backgroundColor: isListening ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
                        borderColor: isListening ? theme.colors.primary : 'transparent'
                    }
                ]}>
                  {isProcessing ? (
                      <ActivityIndicator size="large" color={theme.colors.primary} />
                  ) : (
                      <ThemedIcon 
                          name="microphone" 
                          size={48} 
                          color={isListening ? theme.colors.primary : theme.colors.onSurfaceVariant} 
                      />
                  )}
                </View>
              </Animated.View>
              
              {/* Audio Visualizer - shows when listening */}
              {isListening && renderVisualizer()}
              
              <Text variant="bodyLarge" style={{ marginTop: 24, textAlign: 'center', color: theme.colors.onSurface }}>
                {isListening ? 'Listening... Tap Done when finished' : isProcessing ? 'Processing...' : 'Tap mic to start'}
              </Text>
              
              <Text variant="headlineSmall" style={{ marginTop: 16, textAlign: 'center', color: theme.colors.primary, opacity: 0.8, minHeight: 60 }}>
                {transcript || interimTranscript || (isListening ? "" : "Say 'Add a goal to...'")}
              </Text>

              {isListening && (transcript || interimTranscript) && (
                <Button 
                  mode="contained" 
                  onPress={handleDone} 
                  style={{ marginTop: 16 }}
                  icon="check"
                >
                  Done
                </Button>
              )}

              {!isListening && !isProcessing && (
                  <Button mode="contained" onPress={startListening} style={{ marginTop: 24 }}>
                      Start Listening
                  </Button>
              )}

              {error && (
                  <Text style={{ color: theme.colors.error, marginTop: 16 }}>{error}</Text>
              )}
            </View>
          ) : editingValues ? (
            <ScrollView contentContainerStyle={styles.confirmationState}>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>TITLE</Text>
              <TextInput 
                  value={editingValues.title}
                  onChangeText={(t) => setEditingValues({...editingValues, title: t})}
                  mode="outlined"
                  style={{ marginBottom: 16, backgroundColor: theme.colors.surface }}
              />

              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>DESCRIPTION</Text>
              <TextInput 
                  value={editingValues.description}
                  onChangeText={(t) => setEditingValues({...editingValues, description: t})}
                  mode="outlined"
                  multiline
                  style={{ marginBottom: 16, backgroundColor: theme.colors.surface, minHeight: 80 }}
              />

              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>DUE DATE</Text>
              <TouchableOpacity 
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                  style={[styles.dateButton, { borderColor: theme.colors.outline }]}
              >
                  <Text style={{ color: theme.colors.onSurface, fontSize: 16 }}>
                      {editingValues.dueDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </Text>
                  <ThemedIcon name="calendar" size={20} themeColor="primary" />
              </TouchableOpacity>

              <PriorityPicker 
                  value={editingValues.priority} 
                  onChange={(p) => setEditingValues({...editingValues, priority: p})} 
              />

              <CategoryPicker 
                  value={editingValues.categoryId}
                  onChange={(c) => setEditingValues({...editingValues, categoryId: c})}
              />

              <RecurrencePicker 
                  value={editingValues.recurrence}
                  onChange={(r) => setEditingValues({...editingValues, recurrence: r})}
              />

              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>CONFIDENCE</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                  <Text style={{ color: editingValues.confidence > 0.8 ? theme.colors.primary : theme.colors.error }}>
                      {Math.round(editingValues.confidence * 100)}%
                  </Text>
              </View>

              <View style={styles.actionButtons}>
                  <Button mode="outlined" onPress={handleRetry} style={{ flex: 1, marginRight: 8 }}>
                      Retry
                  </Button>
                  <Button mode="contained" onPress={handleCreate} style={{ flex: 1, marginLeft: 8 }}>
                      Create Goal
                  </Button>
              </View>
            </ScrollView>
          ) : null}

          {/* Date Picker Modal */}
          {editingValues && (
            <Portal>
                <PaperModal
                visible={showDatePicker}
                onDismiss={() => setShowDatePicker(false)}
                contentContainerStyle={[
                    styles.modalContent,
                    { backgroundColor: theme.colors.surface },
                ]}
                >
                <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>When is this due?</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
                    {dateOptions.map((option, index) => {
                    const isSelected = editingValues.dueDate.toDateString() === option.date.toDateString();
                    return (
                        <TouchableOpacity
                        key={index}
                        onPress={() => {
                            setEditingValues({...editingValues, dueDate: option.date});
                            setShowDatePicker(false);
                        }}
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
                </PaperModal>
            </Portal>
          )}

        </View>
      </View>
    </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: '50%',
    maxHeight: '90%',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
  },
  listeningState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  pulseRing: {
    borderRadius: 60,
    borderWidth: 3,
    padding: 4,
  },
  micContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
  },
  visualizerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    gap: 4,
    marginTop: 16,
  },
  visualizerBar: {
    width: 6,
    height: 40,
    borderRadius: 3,
  },
  confirmationState: {
      paddingBottom: 24,
  },
  actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 24,
      marginBottom: 32,
  },
  dateButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderRadius: 4,
      borderWidth: 1,
      marginBottom: 16,
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
    maxHeight: 120,
    flexGrow: 0,
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
});

