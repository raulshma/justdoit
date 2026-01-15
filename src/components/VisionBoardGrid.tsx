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
const IMAGE_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

interface VisionBoardGridProps {
  goalId: string;
  images: GoalImage[];
  onImagesChange: (images: GoalImage[]) => void;
  disabled?: boolean;
}

/**
 * VisionBoardGrid - Grid display for vision board images
 * Displays up to 9 images in a 3x3 grid layout with add/remove functionality
 */
export const VisionBoardGrid = memo<VisionBoardGridProps>(({
  goalId,
  images,
  onImagesChange,
  disabled = false,
}) => {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const canAddMore = images.length < IMAGE_LIMITS.vision;

  /**
   * Pick images from library
   */
  const handleAddImages = useCallback(async () => {
    if (!canAddMore) {
      Alert.alert('Limit Reached', `Vision board can have up to ${IMAGE_LIMITS.vision} images.`);
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permission.granted) {
        Alert.alert(
          'Permission Needed',
          'Please grant photo library access to add vision board images.',
          [{ text: 'OK' }]
        );
        return;
      }

      const remainingSlots = goalImageService.getRemainingSlots(images.length, 'vision');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setIsLoading(true);
        
        const newImages: GoalImage[] = [];
        for (let i = 0; i < result.assets.length; i++) {
          const asset = result.assets[i];
          const savedImage = await goalImageService.saveGoalImage(
            asset.uri,
            goalId,
            'vision'
          );
          savedImage.order = images.length + i;
          newImages.push(savedImage);
        }
        
        onImagesChange([...images, ...newImages]);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to add vision board images:', error);
      Alert.alert('Error', 'Failed to add images. Please try again.');
      setIsLoading(false);
    }
  }, [goalId, images, onImagesChange, canAddMore]);

  /**
   * Remove an image from the vision board
   */
  const handleRemoveImage = useCallback((image: GoalImage) => {
    Alert.alert(
      'Remove Image',
      'Remove this image from your vision board?',
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
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <ThemedIcon name="view-grid-outline" size={24} themeColor="primary" />
          <Text variant="titleSmall" style={{ marginLeft: 12, fontWeight: '600', color: theme.colors.onSurface }}>
            VISION BOARD
          </Text>
        </View>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {images.length}/{IMAGE_LIMITS.vision}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
            Adding images...
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {images.map((image, index) => (
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
                  <ThemedIcon name="close" size={12} color="#fff" />
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
              <ThemedIcon name="plus" size={28} themeColor="primary" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {images.length === 0 && !isLoading && (
        <Text variant="bodySmall" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
          Add images that represent your goal vision
        </Text>
      )}
    </View>
  );
});

VisionBoardGrid.displayName = 'VisionBoardGrid';

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
    marginBottom: 16,
  },
  labelRow: {
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
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'transparent',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
});
