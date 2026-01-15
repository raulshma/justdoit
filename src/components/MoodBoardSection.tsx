import React, { useState, useCallback, memo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { Text, useTheme, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { ThemedIcon } from './ThemedIcon';
import { GoalImage } from '../types';
import { goalImageService, IMAGE_LIMITS } from '../services/goalImageService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 16;
const GRID_GAP = 8;
const GRID_COLUMNS = 3;
const IMAGE_SIZE = (SCREEN_WIDTH - GRID_PADDING * 4 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

interface MoodBoardSectionProps {
  goalId: string;
  images: GoalImage[];
  onImagesChange: (images: GoalImage[]) => void;
  disabled?: boolean;
}

/**
 * MoodBoardSection - Collapsible section for inspirational images
 * Pinterest-style grid for motivation and inspiration
 */
export const MoodBoardSection = memo<MoodBoardSectionProps>(({
  goalId,
  images,
  onImagesChange,
  disabled = false,
}) => {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(images.length > 0);

  const canAddMore = images.length < IMAGE_LIMITS.mood;

  /**
   * Toggle section expansion
   */
  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  /**
   * Pick images from library
   */
  const handleAddImages = useCallback(async () => {
    if (!canAddMore) {
      Alert.alert('Limit Reached', `Mood board is limited to ${IMAGE_LIMITS.mood} images.`);
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permission.granted) {
        Alert.alert(
          'Permission Needed',
          'Please grant photo library access to add inspirational images.',
          [{ text: 'OK' }]
        );
        return;
      }

      const remainingSlots = goalImageService.getRemainingSlots(images.length, 'mood');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setIsLoading(true);
        
        const newImages: GoalImage[] = [];
        for (const asset of result.assets) {
          const savedImage = await goalImageService.saveGoalImage(
            asset.uri,
            goalId,
            'mood'
          );
          newImages.push(savedImage);
        }
        
        onImagesChange([...images, ...newImages]);
        setIsLoading(false);
        setIsExpanded(true);
      }
    } catch (error) {
      console.error('Failed to add mood board images:', error);
      Alert.alert('Error', 'Failed to add images. Please try again.');
      setIsLoading(false);
    }
  }, [goalId, images, onImagesChange, canAddMore]);

  /**
   * Remove an image
   */
  const handleRemoveImage = useCallback((image: GoalImage) => {
    Alert.alert(
      'Remove Image',
      'Remove this image from your mood board?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await goalImageService.deleteGoalImage(image);
            const updatedImages = images.filter(img => img.id !== image.id);
            onImagesChange(updatedImages);
          },
        },
      ]
    );
  }, [images, onImagesChange]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>
      <TouchableOpacity style={styles.header} onPress={toggleExpand} activeOpacity={0.7}>
        <View style={styles.labelRow}>
          <ThemedIcon name="heart-multiple-outline" size={24} themeColor="primary" />
          <Text variant="titleSmall" style={{ marginLeft: 12, fontWeight: '600', color: theme.colors.onSurface }}>
            MOOD BOARD
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginRight: 8 }}>
            {images.length}/{IMAGE_LIMITS.mood}
          </Text>
          <ThemedIcon
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            themeColor="onSurfaceVariant"
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                Adding images...
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {images.map((image) => (
                <TouchableOpacity
                  key={image.id}
                  style={styles.imageContainer}
                  onLongPress={() => !disabled && handleRemoveImage(image)}
                  activeOpacity={0.9}
                  disabled={disabled}
                >
                  <Image source={{ uri: image.uri }} style={styles.image} resizeMode="cover" />
                  {!disabled && (
                    <TouchableOpacity
                      style={[styles.removeButton, { backgroundColor: theme.colors.error }]}
                      onPress={() => handleRemoveImage(image)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <ThemedIcon name="close" size={10} color="#fff" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
              
              {canAddMore && !disabled && (
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: theme.colors.primaryContainer }]}
                  onPress={handleAddImages}
                  activeOpacity={0.7}
                >
                  <ThemedIcon name="plus" size={24} themeColor="primary" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {images.length === 0 && !isLoading && (
            <Text variant="bodySmall" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              Add images that inspire and motivate you
            </Text>
          )}
        </>
      )}
    </View>
  );
});

MoodBoardSection.displayName = 'MoodBoardSection';

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    marginTop: 16,
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 10,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'transparent',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
});
