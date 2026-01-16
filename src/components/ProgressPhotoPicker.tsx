import React, { useState, useCallback, memo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { Text, useTheme, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { ThemedIcon } from './ThemedIcon';
import { GoalImage } from '../types';
import { goalImageService, IMAGE_LIMITS } from '../services/goalImageService';
import { useAlert } from '../context/AlertContext';

const PHOTO_SIZE = 100;
const PHOTO_GAP = 12;

interface ProgressPhotoPickerProps {
  goalId: string;
  photos: GoalImage[];
  onPhotosChange: (photos: GoalImage[]) => void;
  disabled?: boolean;
}

/**
 * ProgressPhotoPicker - Horizontal timeline of progress photos
 * Track visual progress over time with dated photos
 */
export const ProgressPhotoPicker = memo<ProgressPhotoPickerProps>(({
  goalId,
  photos,
  onPhotosChange,
  disabled = false,
}) => {
  const theme = useTheme();
  const alert = useAlert();
  const [isLoading, setIsLoading] = useState(false);

  const canAddMore = photos.length < IMAGE_LIMITS.progress;

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  /**
   * Add a new progress photo
   */
  const handleAddPhoto = useCallback(async () => {
    if (!canAddMore) {
      alert.warning('Limit Reached', `Progress photos are limited to ${IMAGE_LIMITS.progress}.`);
      return;
    }

    alert.showAlert({
      title: 'Add Progress Photo',
      message: 'Choose how to add a photo',
      type: 'info',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Take Photo',
          onPress: async () => {
            try {
              const permission = await ImagePicker.requestCameraPermissionsAsync();
              if (!permission.granted) {
                alert.warning('Permission Needed', 'Camera access is required.');
                return;
              }
              
              setIsLoading(true);
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

              if (!result.canceled) {
                const savedImage = await goalImageService.saveGoalImage(
                  result.assets[0].uri,
                  goalId,
                  'progress'
                );
                onPhotosChange([...photos, savedImage]);
              }
              setIsLoading(false);
            } catch (error) {
              console.error('Failed to take photo:', error);
              setIsLoading(false);
            }
          },
        },
        {
          text: 'From Library',
          onPress: async () => {
            try {
              const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!permission.granted) {
                alert.warning('Permission Needed', 'Photo library access is required.');
                return;
              }
              
              setIsLoading(true);
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

              if (!result.canceled) {
                const savedImage = await goalImageService.saveGoalImage(
                  result.assets[0].uri,
                  goalId,
                  'progress'
                );
                onPhotosChange([...photos, savedImage]);
              }
              setIsLoading(false);
            } catch (error) {
              console.error('Failed to pick photo:', error);
              setIsLoading(false);
            }
          },
        },
      ],
    });
  }, [goalId, photos, onPhotosChange, canAddMore, alert]);

  /**
   * Remove a progress photo
   */
  const handleRemovePhoto = useCallback((photo: GoalImage) => {
    alert.confirm(
      'Remove Photo',
      'Remove this progress photo?',
      async () => {
        await goalImageService.deleteGoalImage(photo);
        const updatedPhotos = photos.filter(p => p.id !== photo.id);
        onPhotosChange(updatedPhotos);
      },
      undefined,
      'Remove',
      'Cancel',
      true
    );
  }, [photos, onPhotosChange, alert]);

  // Sort photos by date (oldest first for timeline)
  const sortedPhotos = [...photos].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <ThemedIcon name="chart-timeline-variant" size={24} themeColor="primary" />
          <Text variant="titleSmall" style={{ marginLeft: 12, fontWeight: '600', color: theme.colors.onSurface }}>
            PROGRESS PHOTOS
          </Text>
        </View>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {photos.length}/{IMAGE_LIMITS.progress}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {sortedPhotos.map((photo) => (
            <TouchableOpacity
              key={photo.id}
              style={styles.photoContainer}
              onLongPress={() => !disabled && handleRemovePhoto(photo)}
              disabled={disabled}
              activeOpacity={0.9}
            >
              <Image source={{ uri: photo.uri }} style={styles.photo} resizeMode="cover" />
              <Text variant="labelSmall" style={[styles.dateLabel, { color: theme.colors.onSurfaceVariant }]}>
                {formatDate(photo.createdAt)}
              </Text>
              {!disabled && (
                <TouchableOpacity
                  style={[styles.removeButton, { backgroundColor: theme.colors.error }]}
                  onPress={() => handleRemovePhoto(photo)}
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
              onPress={handleAddPhoto}
              activeOpacity={0.7}
            >
              <ThemedIcon name="camera-plus" size={24} themeColor="primary" />
              <Text variant="labelSmall" style={{ color: theme.colors.primary, marginTop: 4 }}>
                Add
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {photos.length === 0 && !isLoading && (
        <Text variant="bodySmall" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
          Track your visual progress over time
        </Text>
      )}
    </View>
  );
});

ProgressPhotoPicker.displayName = 'ProgressPhotoPicker';

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
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  scrollContent: {
    paddingBottom: 4,
    gap: PHOTO_GAP,
  },
  photoContainer: {
    width: PHOTO_SIZE,
    alignItems: 'center',
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 12,
  },
  dateLabel: {
    marginTop: 4,
    fontSize: 11,
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
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
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
  },
});
